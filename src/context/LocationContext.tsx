import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getDetailedLocation } from '../utils/geolocation';

export type Scope = 'condo' | 'neighborhood' | 'city';

export interface LocationData {
  condo: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
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
    const parsed = JSON.parse(raw) as LocationData;
    // Basic validation to prevent injected garbage
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && typeof parsed.city === 'string') {
      return parsed;
    }
    return null;
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

    // Persistência imediata no localStorage para eliminar glitch de carregamento futuro
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locWithTime));
    } catch { /* storage cheio, ignora */ }

    // Se a localização veio com "Bairro Desconhecido", rebaixamos o escopo graciosamente para a cidade.
    const newScope: Scope = loc.neighborhood === 'Bairro Desconhecido' ? 'city' : 'neighborhood';
    setScope(newScope);
    try { localStorage.setItem(SCOPE_STORAGE_KEY, newScope); } catch { /* ignore */ }

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
    } catch (err) {
      console.error('Erro ao salvar histórico de localização:', err);
    }
  };

  const editNeighborhood = async (newName: string) => {
    if (!location || !newName.trim()) return;

    const updatedLocation = { ...location, neighborhood: newName.trim() };
    setLocation(updatedLocation);
    setScope('neighborhood');

    // Persistir override manual de bairro
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updatedLocation));
      localStorage.setItem(SCOPE_STORAGE_KEY, 'neighborhood');
    } catch { /* ignore */ }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('location_history').insert({
          user_id: session.user.id,
          lat: updatedLocation.lat,
          lng: updatedLocation.lng,
          city: updatedLocation.city,
          neighborhood: updatedLocation.neighborhood
        });
      }
    } catch (err) {
      console.error('Erro ao salvar override de bairro:', err);
    }
  };

  React.useEffect(() => {
    const checkBackgroundLocation = () => {
      // Background location refresh logic
      if (!location || !navigator.geolocation) return;
      
      const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos
      const lastUpdate = location.timestamp || 0;
      
      if (Date.now() - lastUpdate > MAX_AGE_MS) {
        // Soft refresh sem UI loader forçado (se falhar, mantém o antigo)
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          
          // Cálculo de Haversine para > 500m
          const R = 6371e3; // metres
          const φ1 = location.lat * Math.PI/180; // φ, λ in radians
          const φ2 = latitude * Math.PI/180;
          const Δφ = (latitude - location.lat) * Math.PI/180;
          const Δλ = (longitude - location.lng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c; // in metres

          // Se moveu mais de 500m ou passou tempo considerável
          if (d > 500 || (Date.now() - lastUpdate > MAX_AGE_MS * 2)) {
             try {
                const detailedLoc = await getDetailedLocation(latitude, longitude);
                handleLocationUpdate(detailedLoc);
             } catch(e) {
                console.error("Erro background geoloc", e);
             }
          }
        }, () => {}, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
      }
    };

    // Executa ao focar a window para re-avaliação inteligente
    window.addEventListener('focus', checkBackgroundLocation);
    // Executa uma vez no load se já tiver location cached antiga
    checkBackgroundLocation();
    
    return () => window.removeEventListener('focus', checkBackgroundLocation);
  }, [location]);

  const requestLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const detailedLoc = await getDetailedLocation(latitude, longitude);
          handleLocationUpdate(detailedLoc);
        } catch (err: any) {
          setError(err.message || 'Erro ao buscar endereço.');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError('Permissão de localização negada.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const searchManualLocation = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Deteção ultra-rápida de CEP brasileiro (8 dígitos apenas números)
      const cleanCep = query.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();

        if (data.erro) {
          setError('CEP não encontrado em território nacional.');
          setIsLoading(false);
          return;
        }

        // Fake Coords since ViaCEP doesn't return lat/lng, we use standard Brasilia or request Osm
        handleLocationUpdate({
          lat: -15.7801, // Arbitrary center, because UI only uses Strings now for filtering
          lng: -47.9292,
          condo: `${data.logradouro} (${data.cep})` || 'Meu Endereço',
          neighborhood: data.bairro || 'Bairro Desconhecido',
          city: data.localidade || 'Cidade Desconhecida'
        });
        setIsLoading(false);
        return;
      }

      // 2. Fallback Nominatim Universal Mapping (OSM) para Strings "Texto Livre" que funciona inclusive no iOS/Android
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=pt-BR`);
      const data = await res.json();

      if (data && data.length > 0) {
        const locationJson = data[0];
        const addr = locationJson.address;

        const condo = addr.amenity || addr.building || addr.road || addr.residential || query;
        const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
        const city = addr.city || addr.town || addr.municipality || addr.state;

        handleLocationUpdate({
          lat: parseFloat(locationJson.lat),
          lng: parseFloat(locationJson.lon),
          condo: condo || 'Meu Endereço',
          neighborhood: neighborhood || 'Bairro Desconhecido',
          city: city || 'Cidade Desconhecida'
        });
      } else {
        setError('Nenhuma localidade encontrada. Tente digitar [Bairro, Cidade].');
      }

    } catch (err) {
      console.error(err);
      setError('Erro ao buscar servidor de Endereços. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayLocation = location
    ? scope === 'condo' ? location.condo
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
  if (!context) throw new Error('useLocationScope must be used within LocationProvider');
  return context;
};
