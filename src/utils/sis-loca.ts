/**
 * sis-loca.ts
 * Utilitário de Inteligência de Território Sovix
 */

export interface LocationIdentifier {
  city?: string | null;
  neighborhood?: string | null;
  state?: string | null;
  lat?: number | null;
  lon?: number | null;
}

/**
 * Interface para resultados de busca do mapdispo
 */
export interface MapDispoResult {
    id?: string;
    nome_bairro: string;
    cidade: string;
    estado: string;
    latitude: number;
    longitude: number;
    fonte: 'local' | 'externa';
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
    return `Na sua cidade • ${extractBairroName(itemLoc.neighborhood)}`;
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
export const extractBairroName = (bairroRaw: string | null | undefined): string => {
  if (!bairroRaw) return '';
  try {
    // Se for um objeto JSON (Novo Padrão)
    const parsed = JSON.parse(bairroRaw) as SISBairro;
    return (parsed.bairro || '').trim();
  } catch {
    // Se for string pura (Modelo Clássico)
    // SIS-CLEAN: Se a string contiver uma vírgula, tenta pegar a última parte (assumindo Rua, Bairro)
    if (bairroRaw.includes(',')) {
      const parts = bairroRaw.split(',');
      return parts[parts.length - 1].trim();
    }
    return bairroRaw.trim();
  }
};

/**
 * Verifica se um bairro (nome) já existe em uma lista de bairros (JSON ou String)
 * de forma inteligente (case-insensitive e sem acentos).
 */
export const isBairroDuplicate = (list: string[], newBairroName: string): boolean => {
  if (!newBairroName) return false;
  const normalizedNew = normalizeLoc(newBairroName);
  
  return list.some(item => {
    const existingName = extractBairroName(item);
    return normalizeLoc(existingName) === normalizedNew;
  });
};

/**
 * Busca inteligente de bairros já registrados no ecossistema Sovix Connect
 * baseada na cidade atual.
 */
/**
 * Busca Híbrida MapDispo (Local + Nominatim)
 */
export const searchBairrosLocal = async (supabase: any, query: string): Promise<MapDispoResult[]> => {
    if (!query || query.length < 2) return [];
    
    try {
        const { data, error } = await supabase
            .from('bairros')
            .select('*')
            .or(`nome_bairro.ilike.%${query}%,cidade.ilike.%${query}%`)
            .limit(10);
            
        if (error || !data) return [];
        
        return data.map((b: any) => ({
            id: b.id,
            nome_bairro: b.nome_bairro,
            cidade: b.cidade,
            estado: b.estado,
            latitude: b.latitude,
            longitude: b.longitude,
            fonte: 'local'
        }));
    } catch (err) {
        console.error('Erro na busca local mapdispo:', err);
        return [];
    }
};

export const searchBairrosExternal = async (query: string, cityContext?: string): Promise<MapDispoResult[]> => {
    if (!query || query.length < 3) return [];
    
    const fullQuery = cityContext ? `${query}, ${cityContext}` : query;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=5&countrycodes=br`;
    
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'SovixConnect-MapDispo/1.0' }
        });
        
        if (!response.ok) return [];
        
        const data = await response.json();
        
        return data
            .filter((item: any) => item.address && (item.address.suburb || item.address.neighbourhood))
            .map((item: any) => ({
                nome_bairro: item.address.suburb || item.address.neighbourhood,
                cidade: item.address.city || item.address.town || item.address.municipality,
                estado: item.address.state,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                fonte: 'externa'
            }));
    } catch (err) {
        console.error('Erro na busca externa mapdispo:', err);
        return [];
    }
};

/**
 * Orquestrador MapDispo
 * Tenta base local primeiro. Se poucos resultados, busca externo.
 * Salva resultados externos na base local para "aprendizado".
 */
export const mapdispoSearch = async (supabase: any, query: string, cityContext?: string): Promise<MapDispoResult[]> => {
    // 1. Busca Local
    const localResults = await searchBairrosLocal(supabase, query);
    
    // 2. Se temos resultados locais suficientes (e query curta), retornamos
    if (localResults.length >= 5 || query.length < 4) {
        return localResults;
    }
    
    // 3. Busca Externa (Nominatim) para enriquecer
    const externalResults = await searchBairrosExternal(query, cityContext);
    
    // 4. Filtrar duplicatas (por nome e cidade normalizados)
    const combined = [...localResults];
    externalResults.forEach(ext => {
        const isDuplicate = combined.some(loc => 
            normalizeLoc(loc.nome_bairro) === normalizeLoc(ext.nome_bairro) &&
            normalizeLoc(loc.cidade) === normalizeLoc(ext.cidade)
        );
        if (!isDuplicate) {
            combined.push(ext);
            
            // 5. Aprendizado Assíncrono: Salva bairro novo no banco local
            (async () => {
                try {
                    await supabase.from('bairros').insert({
                        nome_bairro: ext.nome_bairro,
                        cidade: ext.cidade,
                        estado: ext.estado,
                        latitude: ext.latitude,
                        longitude: ext.longitude
                    });
                } catch (e) {}
            })();
        }
    });
    
    return combined.slice(0, 10);
};

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
