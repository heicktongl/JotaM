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
        let condo = '';
        let neighborhood = '';
        let city = '';
        let route = '';
        let streetNumber = '';

        // 1. Extrair Rua/Condomínio e Cidade do resultado mais específico
        data.results[0].address_components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('premise') || types.includes('building')) condo = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('administrative_area_level_2') || types.includes('locality')) city = component.long_name;
        });

        // 2. Extração Robusta de Bairro
        // No Brasil, 'sublocality_level_1' costuma ser o bairro exato pelo Google.
        for (const result of data.results) {
            for (const comp of result.address_components) {
                if (comp.types.includes('sublocality_level_1')) {
                    neighborhood = comp.long_name;
                    break;
                }
            }
            if (neighborhood) break;
        }

        // Fallback de bairro caso sublocality_level_1 não seja encontrado
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

        return {
            lat: latitude,
            lng: longitude,
            condo: condo || (route ? `${route}${streetNumber ? `, ${streetNumber}` : ''}` : 'Meu Endereço'),
            neighborhood: neighborhood || 'Bairro Desconhecido',
            city: city || 'Cidade Desconhecida'
        };
    } else {
        throw new Error(data.error_message || 'Não foi possível obter o endereço exato pelo Google Maps.');
    }
};
