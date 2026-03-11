import { LocationData } from '../context/LocationContext';

/**
 * Utilitário global para Geocodificação Reversa.
 * Unifica a inteligência de extração de bairro (Google Maps -> OSM fallback)
 * para que Lojistas, Prestadores e Consumidores operem sob as mesmas métricas.
 */
export const getDetailedLocation = async (latitude: number, longitude: number): Promise<LocationData> => {
    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        // Fallback Gratuito: Nominatim (OpenStreetMap) com extração robusta para o Brasil
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`);
        const data = await res.json();

        if (data && data.address) {
            const addr = data.address;

            // 1. Extração do Condomínio / Rua
            const condo = addr.amenity || addr.building || addr.residential ||
                (addr.road ? `${addr.road}${addr.house_number ? `, ${addr.house_number}` : ''}` : '');

            // 2. Extração Robusta do Bairro (Priorizando as tags mais precisas do OSM no Brasil)
            const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter || addr.village;

            const city = addr.city || addr.town || addr.municipality || addr.county;

            return {
                lat: latitude,
                lng: longitude,
                condo: condo || 'Meu Endereço',
                neighborhood: neighborhood || 'Bairro Desconhecido',
                city: city || 'Cidade Desconhecida'
            };
        } else {
            throw new Error('Não foi possível obter o endereço exato pelo serviço gratuito.');
        }
    }

    // Fluxo Premium: Google Maps API (Alta precisão)
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR`);
    const data = await res.json();

    if (data.status === 'OK' && data.results.length > 0) {
        let rawCondo = '';
        let neighborhood = '';
        let city = '';
        let route = '';
        let streetNumber = '';
        let locationType = data.results[0].geometry.location_type;

        const forbiddenBairroTerms = ['residencial', 'condominio', 'edificio', 'village', 'apartamento', 'bloco', 'torre'];

        /**
         * SIS-LOCA-SCRUBBING: Limpa nomes que não são bairros geográficos reais.
         */
        const isActuallyABairro = (name: string) => {
            if (!name) return false;
            const lower = name.toLowerCase();
            return !forbiddenBairroTerms.some(term => lower.includes(term));
        };

        // 1. Extrair Rua/Condomínio e Cidade do resultado mais específico
        data.results[0].address_components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('premise') || types.includes('building') || types.includes('point_of_interest')) rawCondo = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('administrative_area_level_2') || types.includes('locality')) city = component.long_name;
        });

        // 2. Extração Robusta de Bairro (Soberania do Bairro Geográfico)
        for (const result of data.results) {
            for (const comp of result.address_components) {
                // Prioriza sublocality_level_1 (Bairro oficial no BR)
                if (comp.types.includes('sublocality_level_1') && isActuallyABairro(comp.long_name)) {
                    neighborhood = comp.long_name;
                    break;
                }
            }
            if (neighborhood) break;
        }

        // Fallback de bairro caso sublocality_level_1 falhe ou seja um residencial
        if (!neighborhood) {
            for (const result of data.results) {
                for (const comp of result.address_components) {
                    if ((comp.types.includes('sublocality') || comp.types.includes('neighborhood')) && isActuallyABairro(comp.long_name)) {
                        neighborhood = comp.long_name;
                        break;
                    }
                }
                if (neighborhood) break;
            }
        }

        /**
         * SIS-LOCA-ROOFTOP-LOCK: 
         * Só habilita o nome do Residencial se estivermos "em cima do teto".
         * Caso contrário, o nome do condomínio vizinho não deve vazar para a UI.
         */
        let finalCondo = '';
        if (locationType === 'ROOFTOP' && rawCondo) {
            finalCondo = rawCondo;
        } else {
            // Se não está dentro, mostra apenas a Rua e Número
            finalCondo = route ? `${route}${streetNumber ? `, ${streetNumber}` : ''}` : 'Meu Endereço';
        }

        return {
            lat: latitude,
            lng: longitude,
            condo: finalCondo,
            neighborhood: neighborhood || 'Bairro Desconhecido',
            city: city || 'Cidade Desconhecida'
        };
    } else {
        throw new Error(data.error_message || 'Não foi possível obter o endereço exato pelo Google Maps.');
    }
};
