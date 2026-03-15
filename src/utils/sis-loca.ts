/**
 * sis-loca.ts
 * Utilitário de Inteligência de Território Sovix
 */

export interface LocationIdentifier {
  city?: string | null;
  neighborhood?: string | null;
}

export interface MapDispoResult {
    nome_bairro: string;
    cidade: string;
    estado: string;
    latitude: number;
    longitude: number;
    fonte: 'local' | 'osm' | 'cep';
    cep?: string;
}

/**
 * Normaliza strings para comparação (remove acentos, espaços extras e lowercases)
 */
export const normalizeLoc = (s: string | null | undefined): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Calcula o rótulo de proximidade entre o usuário e o item
 * Suporta lógica de cobertura hiperlocal (SIS-LOCA)
 */
export const calculateProximityLabel = (
  userLoc: LocationIdentifier | null,
  itemLoc: LocationIdentifier | null,
  bairrosDisponiveis: string[] | null = []
): string => {
  if (!userLoc || !itemLoc || !itemLoc.city) return 'Localização indefinida';

  const userCity = normalizeLoc(userLoc.city);
  const itemCity = normalizeLoc(itemLoc.city);

  // 1. Cidades Diferentes (Bloqueio Total já tratado pelo Guard)
  if (userCity !== itemCity) {
    return `${itemLoc.neighborhood || 'Bairro'}, ${itemLoc.city}`;
  }

  // 2. Mesma Cidade, Bairro Desconhecido do Usuário (Navegação por cidade)
  if (!userLoc.neighborhood || normalizeLoc(userLoc.neighborhood) === 'bairro desconhecido') {
    return `Em ${itemLoc.city}`;
  }

  const userN = normalizeLoc(userLoc.neighborhood);
  const itemN = normalizeLoc(itemLoc.neighborhood);

  // 3. Mesma Cidade, Bairros Iguais (Item está no bairro do usuário)
  if (userN === itemN && itemN !== '') {
    return 'No seu bairro';
  }

  // 4. Bairros diferentes, mas o item ATENDE o bairro do usuário (SIS-LOCA)
  if (bairrosDisponiveis && bairrosDisponiveis.length > 0) {
    const supportsUserBairro = bairrosDisponiveis.some(b => 
      normalizeLoc(extractBairroName(b)) === userN
    );
    if (supportsUserBairro) {
      return 'Atende seu bairro';
    }
  }

  // 5. Mesma Cidade, Bairros Diferentes (Sem cobertura garantida ou cobertura geral não especificada)
  if (itemLoc.neighborhood) {
    return `Na sua cidade • ${itemLoc.neighborhood}`;
  }

  return `Em ${itemLoc.city}`;
};

/**
 * Interface do Novo Padrão de Bairro Detalhado
 */
export interface SISBairro {
  bairro: string;
  rua?: string;
  numero?: string;
  complemento?: string;
}

/**
 * Extrai o nome do bairro de uma string salva no BD
 * Faz fallback para a própria string caso não seja um JSON válido.
 */
export const extractBairroName = (bairroRaw: string): string => {
  if (!bairroRaw) return '';
  try {
    const parsed = JSON.parse(bairroRaw) as SISBairro;
    return parsed.bairro || bairroRaw;
  } catch {
    // É o modelo clássico string puro
    return bairroRaw;
  }
};

/**
 * Busca inteligente de bairros já registrados no ecossistema Sovix Connect
 * baseada na cidade atual.
 */
export const fetchNeighborhoodsByCity = async (supabase: any, city: string): Promise<string[]> => {
  if (!city) return [];
  try {
    // Buscar bairros distintos na store_locations para aquela cidade
    // Para nao ter problema de nulls e simplificar
    const { data, error } = await supabase
      .from('store_locations')
      .select('neighborhood')
      .ilike('city', city)
      .not('neighborhood', 'is', null);

    if (error || !data) return [];
    
    // Extrai unicos usando Set (pois Supabase não tem SELECT DISTINCT direto fácil no JS sdk v2)
    const unique = Array.from(new Set(data.map(d => d.neighborhood))).filter(Boolean) as string[];
    return unique.sort();
  } catch (err) {
    console.error('Erro na Busca Sis-Loca de Bairros:', err);
    return [];
  }
};

/**
 * Motor de Busca Territorial Dispositivo (MapDispo)
 * Integra busca local (banco) com busca externa (OpenStreetMap/Nominatim)
 */
export const mapdispoSearch = async (supabase: any, query: string, cityContext?: string): Promise<MapDispoResult[]> => {
    if (!query || query.length < 2) return [];

    const results: MapDispoResult[] = [];
    const cleanCep = query.replace(/\D/g, '');

    try {
        // 0. Busca por CEP (Prioridade SIS-LOCA)
        if (cleanCep.length >= 5 && cleanCep.length <= 8 && /^\d+$/.test(cleanCep)) {
            // 0.1 Busca Local por CEP
            const { data: localCepData } = await supabase
                .from('store_locations')
                .select('neighborhood, city, state, latitude, longitude')
                .eq('zip_code', cleanCep)
                .limit(5);

            if (localCepData) {
                localCepData.forEach((d: any) => {
                    results.push({
                        nome_bairro: d.neighborhood,
                        cidade: d.city,
                        estado: d.state || 'UF',
                        latitude: d.latitude,
                        longitude: d.longitude,
                        fonte: 'local',
                        cep: cleanCep
                    });
                });
            }

            // 0.2 Busca Externa por CEP (ViaCEP)
            try {
                const cepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const cepData = await cepRes.json();
                
                if (cepData && !cepData.erro && cepData.bairro) {
                    results.push({
                        nome_bairro: cepData.bairro,
                        cidade: cepData.localidade,
                        estado: cepData.uf,
                        latitude: 0,
                        longitude: 0,
                        fonte: 'cep',
                        cep: cleanCep
                    });
                }
            } catch (ce) {
                console.error('ViaCEP Error:', ce);
            }
        }

        // 1. Busca Local (Base Sovix)
        const { data: localData } = await supabase
            .from('store_locations')
            .select('neighborhood, city, state, latitude, longitude')
            .ilike('neighborhood', `%${query}%`)
            .limit(5);

        if (localData) {
            localData.forEach((d: any) => {
                results.push({
                    nome_bairro: d.neighborhood,
                    cidade: d.city,
                    estado: d.state || 'UF',
                    latitude: d.latitude,
                    longitude: d.longitude,
                    fonte: 'local'
                });
            });
        }

        const fullQuery = cityContext ? `${query}, ${cityContext}` : query;
        const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=10&addressdetails=1&countrycodes=br&accept-language=pt-BR`, {
            headers: { 'User-Agent': 'SovixConnect/1.0' }
        });
        const osmData = await osmRes.json();

        if (osmData) {
            osmData.forEach((item: any) => {
                const addr = item.address;
                const bairro = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter;
                if (bairro) {
                    results.push({
                        nome_bairro: bairro,
                        cidade: addr.city || addr.town || addr.municipality,
                        estado: addr.state,
                        latitude: parseFloat(item.lat),
                        longitude: parseFloat(item.lon),
                        fonte: 'osm'
                    });
                }
            });
        }

        // Remover duplicatas por nome de bairro e cidade
        const seen = new Set();
        return results.filter(r => {
            const key = `${normalizeLoc(r.nome_bairro)}|${normalizeLoc(r.cidade)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 10);

    } catch (e) {
        console.error('SIS-LOCA MapDispo Error:', e);
        return results;
    }
};
/**
 * Verifica se um bairro já existe em uma lista, ignorando case e acentos.
 */
export const isBairroDuplicate = (list: string[], name: string): boolean => {
  const normalized = normalizeLoc(name);
  return list.some(item => normalizeLoc(extractBairroName(item)) === normalized);
};
