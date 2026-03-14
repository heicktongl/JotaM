import { LocationData } from '../context/LocationContext';

/**
 * SIS-LOCA-ENGINE: Arquitetura de Pipeline para Precisão Hiperlocal
 */

export const SIS_LOCA_RESIDENTIAL_INDICATORS = [
    'residencial', 'condominio', 'edificio', 'village', 'apartamento', 
    'bloco', 'torre', 'condomínio', 'resid.', 'res.', 'cond.', 
    'edif.', 'ed.', 'building', 'premise', 'jardim', 'clube', 'viver', 
    'parque residencial', 'piscina', 'villagio', 'parque', 'alameda'
];

interface RawSourceData {
    source: 'google' | 'viacep' | 'osm';
    condo?: string;
    neighborhood?: string;
    city?: string;
    cep?: string;
    type?: string;
    score: number;
}

class TerritoryEngine {
    private sources: RawSourceData[] = [];
    private lat: number;
    private lng: number;

    constructor(lat: number, lng: number) {
        this.lat = lat;
        this.lng = lng;
    }

    private detectResidencial(name: string | null | undefined): boolean {
        if (!name) return false;
        const lower = name.toLowerCase();
        return SIS_LOCA_RESIDENTIAL_INDICATORS.some(term => lower.includes(term));
    }

    private cleanNeighborhood(name: string, condoName?: string): string {
        if (!name) return 'Bairro Desconhecido';
        const lower = name.toLowerCase();
        
        // Se o bairro for um residencial, ele não é um bairro geográfico puro
        if (this.detectResidencial(name)) return '';

        // Se for igual ao condomínio, é duplicata
        if (condoName && lower === condoName.toLowerCase()) return '';

        return name;
    }

    async collectGoogle(apiKey: string): Promise<void> {
        try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.lat},${this.lng}&key=${apiKey}&language=pt-BR`);
            const data = await res.json();

            if (data.status === 'OK' && data.results.length > 0) {
                data.results.forEach((result: any, idx: number) => {
                    const locationType = result.geometry.location_type;
                    let neighborhood = '';
                    let condo = '';
                    let cep = '';
                    let city = '';

                    result.address_components.forEach((comp: any) => {
                        const types = comp.types;
                        if (types.includes('postal_code')) cep = comp.long_name.replace(/\D/g, '');
                        if (types.includes('premise') || types.includes('building') || types.includes('point_of_interest')) {
                            condo = comp.long_name;
                        }
                        if (types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('sublocality')) {
                            neighborhood = comp.long_name;
                        }
                        if (types.includes('administrative_area_level_2') || types.includes('locality')) {
                            city = comp.long_name;
                        }
                    });

                    // Score baseado na precisão do ponto
                    const baseScore = locationType === 'ROOFTOP' ? 0.9 : 0.6;
                    this.sources.push({
                        source: 'google',
                        condo,
                        neighborhood,
                        city,
                        cep,
                        type: locationType,
                        score: baseScore - (idx * 0.1) // Resultados secundários têm menos peso
                    });
                });
            }
        } catch (e) {
            console.error('SIS-LOCA: Google Collect Error', e);
        }
    }

    async collectViaCep(cep: string): Promise<void> {
        if (!cep || cep.length !== 8) return;
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (data && !data.erro) {
                this.sources.push({
                    source: 'viacep',
                    neighborhood: data.bairro,
                    city: data.localidade,
                    condo: data.logradouro,
                    cep: data.cep.replace(/\D/g, ''),
                    score: 1.0 // Verdade Absoluta Geográfica
                });
            }
        } catch (e) {
            console.warn('SIS-LOCA: ViaCEP Collect Error', e);
        }
    }

    snap(): LocationData {
        let finalCondo = 'Meu Endereço';
        let finalNeighborhood = 'Bairro Desconhecido';
        let finalCity = 'Cidade Desconhecida';
        let finalCep = '';
        let isResidencial = false;

        // 1. Extração de CEP (Maior score ganha)
        const bestCep = [...this.sources].sort((a, b) => b.score - a.score).find(s => s.cep);
        finalCep = bestCep?.cep || '';

        // 2. Extração de Bairro (Soberania Geográfica)
        // Filtramos qualquer "bairro" que na verdade seja um residencial
        const neighborSources = this.sources
            .filter(s => s.neighborhood && !this.detectResidencial(s.neighborhood))
            .sort((a, b) => b.score - a.score);
        
        if (neighborSources.length > 0) {
            finalNeighborhood = neighborSources[0].neighborhood!;
        }

        // 3. Extração de Residencial (Condo)
        // Se o ViaCEP ou Google sugeriu um bairro que é residencial, ele vira Condo
        const condoCandidates = this.sources
            .filter(s => s.condo || (s.neighborhood && this.detectResidencial(s.neighborhood)))
            .map(s => {
                const name = this.detectResidencial(s.neighborhood) ? s.neighborhood! : s.condo!;
                return { name, score: s.score };
            })
            .filter(c => c.name && c.name !== 'Meu Endereço')
            .sort((a, b) => b.score - a.score);

        if (condoCandidates.length > 0) {
            finalCondo = condoCandidates[0].name;
            isResidencial = this.detectResidencial(finalCondo);
        } else {
            // Fallback para Rua se não houver nome de prédio
            const routeSource = this.sources.find(s => s.source === 'google' && s.condo);
            if (routeSource) finalCondo = routeSource.condo!;
        }

        // 4. Extração de Cidade
        const citySource = this.sources.find(s => s.city);
        if (citySource) finalCity = citySource.city!;

        return {
            lat: this.lat,
            lng: this.lng,
            condo: finalCondo,
            neighborhood: finalNeighborhood,
            city: finalCity,
            cep: finalCep,
            isResidencial
        };
    }
}

/**
 * Interface Pública Unificada
 */
export const getDetailedLocation = async (latitude: number, longitude: number): Promise<LocationData> => {
    const engine = new TerritoryEngine(latitude, longitude);
    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

    if (apiKey) {
        await engine.collectGoogle(apiKey);
        
        // Triangulação com ViaCEP se o Google achou um CEP
        const tempSnap = engine.snap();
        if (tempSnap.cep) {
            await engine.collectViaCep(tempSnap.cep);
        }
        
        const finalResult = engine.snap();
        console.log('SIS-LOCA Engine: Pipeline Complete', finalResult);
        return finalResult;
    }

    // Fallback Legado se não houver API Key
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`);
    const data = await res.json();
    const addr = data.address;
    const condo = addr.amenity || addr.building || addr.residential || addr.house_name || addr.road || 'Meu Endereço';
    
    return {
        lat: latitude,
        lng: longitude,
        condo: condo,
        neighborhood: addr.neighbourhood || addr.suburb || 'Bairro Desconhecido',
        city: addr.city || addr.town || 'Cidade Desconhecida',
        isResidencial: SIS_LOCA_RESIDENTIAL_INDICATORS.some(t => condo.toLowerCase().includes(t))
    };
};

export const sisLocaDetectResidencial = (name: string | null | undefined): boolean => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return SIS_LOCA_RESIDENTIAL_INDICATORS.some(term => lower.includes(term));
};

export const sisLocaScrubNeighborhood = (name: string | null | undefined): string => {
    if (!name) return 'Bairro Desconhecido';
    return name;
};

// SIS-LOCA-SMART-CACHE: Utilitário de distância
export const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};
