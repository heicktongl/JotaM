import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Scope = 'condo' | 'neighborhood' | 'city';

export interface LocationData {
  condo: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
}

interface LocationContextType {
  scope: Scope;
  setScope: (scope: Scope) => void;
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  displayLocation: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [scope, setScope] = useState<Scope>('neighborhood');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationUpdate = async (loc: LocationData) => {
    setLocation(loc);
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
          const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

          if (!apiKey) {
            // Serviço Gratuito: Nominatim (OpenStreetMap) com extração robusta para o Brasil
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`);
            const data = await res.json();

            if (data && data.address) {
              const addr = data.address;

              // 1. Extração do Condomínio / Rua
              const condo = addr.amenity || addr.building || addr.residential ||
                (addr.road ? `${addr.road}${addr.house_number ? `, ${addr.house_number}` : ''}` : '');

              // 2. Extração Robusta do Bairro (Priorizando as tags mais precisas do OSM no Brasil)
              const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter || addr.village;

              const city = addr.city || addr.town || addr.municipality;

              handleLocationUpdate({
                lat: latitude,
                lng: longitude,
                condo: condo || 'Meu Endereço',
                neighborhood: neighborhood || 'Bairro Desconhecido',
                city: city || 'Cidade Desconhecida'
              });
            } else {
              setError('Não foi possível obter o endereço exato pelo serviço gratuito.');
            }
            setIsLoading(false);
            return;
          }

          // Use Google Maps API exclusively, forcing Portuguese language
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR`);
          const data = await res.json();

          if (data.status === 'OK' && data.results.length > 0) {
            let condo = '';
            let neighborhood = '';
            let city = '';
            let route = '';
            let streetNumber = '';

            // 1. Extract Street/Condo and City from the most specific result
            data.results[0].address_components.forEach((component: any) => {
              const types = component.types;
              if (types.includes('premise') || types.includes('building')) condo = component.long_name;
              if (types.includes('route')) route = component.long_name;
              if (types.includes('street_number')) streetNumber = component.long_name;
              if (types.includes('administrative_area_level_2') || types.includes('locality')) city = component.long_name;
            });

            // 2. Robust Neighborhood Extraction (Iterate through all results to find the exact neighborhood)
            // In Brazil, 'sublocality_level_1' is usually the exact neighborhood.
            for (const result of data.results) {
              for (const comp of result.address_components) {
                if (comp.types.includes('sublocality_level_1')) {
                  neighborhood = comp.long_name;
                  break;
                }
              }
              if (neighborhood) break;
            }

            // Fallback for neighborhood if sublocality_level_1 is not found
            if (!neighborhood) {
              for (const result of data.results) {
                for (const comp of result.address_components) {
                  if (comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
                    neighborhood = comp.long_name;
                    break;
                  }
                }
                if (neighborhood) break;
              }
            }

            handleLocationUpdate({
              lat: latitude,
              lng: longitude,
              condo: condo || (route ? `${route}${streetNumber ? `, ${streetNumber}` : ''}` : 'Meu Endereço'),
              neighborhood: neighborhood || 'Bairro Desconhecido',
              city: city || 'Cidade Desconhecida'
            });
          } else {
            setError(data.error_message || 'Não foi possível obter o endereço exato.');
          }
        } catch (err) {
          setError('Erro ao buscar endereço no Google Maps.');
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

  const displayLocation = location
    ? scope === 'condo' ? location.condo
      : scope === 'neighborhood' ? location.neighborhood
        : location.city
    : 'Definir localização';

  return (
    <LocationContext.Provider value={{ scope, setScope, location, isLoading, error, requestLocation, displayLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationScope = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocationScope must be used within LocationProvider');
  return context;
};
