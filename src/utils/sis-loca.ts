/**
 * sis-loca.ts
 * Utilitário de Inteligência de Território Sovix
 */

export interface LocationIdentifier {
  city?: string | null;
  neighborhood?: string | null;
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
