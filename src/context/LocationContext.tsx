import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getDetailedLocation, sisLocaScrubNeighborhood, sisLocaDetectResidencial, getDistanceMeters } from '../utils/geolocation';

export type Scope = 'condo' | 'neighborhood' | 'city';

export interface LocationData {
  condo: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  cep?: string; // SIS-LOCA CROSS-DATA
  isResidencial?: boolean;
  timestamp?: number;
}

interface LocationContextType {
  scope: Scope;
  setScope: (scope: Scope) => void;
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  searchManualLocation: (query: string) => Promise<void>;
  editNeighborhood: (newName: string) => void;
  displayLocation: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = 'sovix_location_v1';
const SCOPE_STORAGE_KEY = 'sovix_scope_v1';

const readCachedLocation = (): LocationData | null => {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocationData;
  } catch {
    return null;
  }
};

const readCachedScope = (): Scope => {
  try {
    const raw = localStorage.getItem(SCOPE_STORAGE_KEY);
    return (raw as Scope) || 'neighborhood';
  } catch {
    return 'neighborhood';
  }
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [scope, setScope] = useState<Scope>(readCachedScope);
  const [location, setLocation] = useState<LocationData | null>(readCachedLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationUpdate = async (loc: LocationData) => {
    const locWithTime = { ...loc, timestamp: Date.now() };
    setLocation(locWithTime);
    console.log('SIS-LOCA Context: Estado atualizado com:', locWithTime);

    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locWithTime));
      console.log('SIS-LOCA Context: Cache localStorage atualizado.');
    } catch { /* ignore */ }

    // SIS-LOCA-SMART-SCOPE: Mantém o escopo se já estiver definido, exceto no load inicial
    if (scope === 'city' || loc.neighborhood === 'Bairro Desconhecido') {
      const newScope: Scope = loc.neighborhood === 'Bairro Desconhecido' ? 'city' : 'neighborhood';
      setScope(newScope);
      try { localStorage.setItem(SCOPE_STORAGE_KEY, newScope); } catch { /* ignore */ }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('location_history').insert({
          user_id: session.user.id,
          lat: loc.lat,
          lng: loc.lng,
          city: loc.city,
          neighborhood: loc.neighborhood
        });
      }
    } catch (e) { console.error('SIS-LOCA Historical Sync Error', e); }
  };

  const editNeighborhood = async (newName: string) => {
    if (!location || !newName.trim()) return;

    const normalizedName = newName.trim();
    const isRes = sisLocaDetectResidencial(normalizedName);
    
    const updatedLocation = { 
        ...location, 
        neighborhood: isRes ? 'Bairro Desconhecido' : sisLocaScrubNeighborhood(normalizedName),
        isResidencial: isRes || location.isResidencial
    };
    
    setLocation(updatedLocation);
    setScope('neighborhood');
    try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocation)); } catch { /* ignore */ }
  };

  const requestLocation = () => {
    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // SIS-LOCA-SMART-CACHE: Verifica se o deslocamento justifica nova chamada
        if (location) {
          const distance = getDistanceMeters(location.lat, location.lng, latitude, longitude);
          console.log(`SIS-LOCA Cache Check: Deslocamento de ${distance.toFixed(1)} metros.`);
          if (distance < 20) { // Menos de 20 metros, usamos o cache
            console.log('SIS-LOCA Cache: Mantendo localização atual (deslocamento mínimo).');
            setIsLoading(false);
            return;
          }
        }

        try {
          const detailedLoc = await getDetailedLocation(latitude, longitude);
          handleLocationUpdate(detailedLoc);
        } catch (err: any) {
          setError(err.message || 'Erro SIS-LOCA');
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setError('Acesso à localização negado.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const searchManualLocation = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const cleanCep = query.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();

        if (data.erro) {
          setError('CEP não encontrado.');
          setIsLoading(false);
          return;
        }

        let infoBairro = data.bairro || 'Bairro Desconhecido';
        let condo = data.logradouro || 'Endereço Indefinido';
        const isResidencial = sisLocaDetectResidencial(infoBairro) || sisLocaDetectResidencial(data.logradouro);
        
        // SIS-LOCA-SMART: Se o bairro do ViaCEP for um residencial, movemos para condo
        if (sisLocaDetectResidencial(infoBairro)) {
            console.log('SIS-LOCA Context: Expulsando residencial do bairro manual:', infoBairro);
            condo = infoBairro;
            infoBairro = 'Bairro Desconhecido'; // Precisaremos cavar o bairro se possível, ou deixar pro usuário mapear
        }

        handleLocationUpdate({
          lat: -15.7801, // Mock para CEP sem GPS, mas mantém a estrutura
          lng: -47.9292,
          condo,
          neighborhood: infoBairro === 'Bairro Desconhecido' ? infoBairro : sisLocaScrubNeighborhood(infoBairro),
          city: data.localidade || 'Cidade Desconhecida',
          cep: cleanCep,
          isResidencial
        });
        setIsLoading(false);
        return;
      }

      // Fallback OSM
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=pt-BR`);
      const data = await res.json();

      if (data && data.length > 0) {
        const locationJson = data[0];
        const addr = locationJson.address;

        const condo = addr.amenity || addr.building || addr.road || addr.residential || query;
        const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
        const city = addr.city || addr.town || addr.municipality || addr.state;

        const isResidencial = sisLocaDetectResidencial(condo) || sisLocaDetectResidencial(neighborhood);

        handleLocationUpdate({
          lat: parseFloat(locationJson.lat),
          lng: parseFloat(locationJson.lon),
          condo: condo || 'Endereço Indefinido',
          neighborhood: sisLocaScrubNeighborhood(neighborhood),
          city: city || 'Cidade Desconhecida',
          isResidencial
        });
      } else {
        setError('Localidade não encontrada.');
      }
    } catch (err) {
      setError('Erro de conexão SIS-LOCA.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayLocation = location
    ? scope === 'condo' 
      ? (location.isResidencial ? location.condo : location.neighborhood)
      : scope === 'neighborhood' ? location.neighborhood
        : location.city
    : 'Definir localização';

  return (
    <LocationContext.Provider value={{ scope, setScope, location, isLoading, error, requestLocation, searchManualLocation, editNeighborhood, displayLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationScope = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('SIS-LOCA Context Error');
  return context;
};
