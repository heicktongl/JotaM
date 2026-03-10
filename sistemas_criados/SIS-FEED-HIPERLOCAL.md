# SIS-FEED-HIPERLOCAL
*Arquitetura de Feed e Busca baseada em Localidade Estrita*

## 1. Visão Geral
Este algoritmo garante que os usuários visualizem primariamente e exclusivamente produtos e serviços localizados no seu próprio bairro, criando uma conexão de conveniência imediata. O algoritmo é dividido em duas frentes: o Feed (vitrine principal) e a Busca.

## 2. Regra de Ouro do Feed
* "O feed padrão deve sempre mostrar apenas conteúdos do bairro do usuário."
* "Nunca misturar bairros diferentes no feed padrão."

### 2.1 Lógica do Feed
**Entrada:** `bairro_usuario` e `localizacao_usuario`.
1. **Filtro Básico:** Busca todos os conteúdos do BD de forma global. Em seguida, processa na engine do cliente para comparar se o conteúdo está contido no `bairro_usuario`.
2. **Priorização Temporal (Selo Quente🔥):** 
   - Define produtos como "recentes" se possuírem `data_publicacao <= 48h`.
   - Se a lista de recentes existir, eles são exibidos **no topo**.
   - Se não existir (ou depois dos recentes), exibe-se os produtos mais antigos do mesmo bairro.
3. **Ordenação por Relevância (Score):**
   - Os produtos são ordenados de forma decrescente através do score (baseado em taxa de cliques, pedidos, avaliações e distância proxy, utilizando `created_at` e `rating` enquanto telemetria detalhada não estiver disponível no DB).

> **Atenção:** Em nenhuma hipótese o feed listará produtos que não atendam o bairro atual. Se o feed estiver vazio, exibimos o estado "Vazio" focado em atração de novos vendedores locais.

## 3. Lógica da Busca (`SearchPage`)
Diferente do feed, a busca aceita flexibilidade para ajudar o usuário a encontrar as demandas da melhor forma.

**Entrada:** `termo_busca` + `bairro_usuario`.
1. **Pesquisa Padrão:** Recupera todos os produtos/serviços que deem "match" com o termo pesquisado.
2. **Filtro de Camadas (Tiered Search):**
   - **Camada 1 (Mesmo Bairro):** Exibe produtos disponíveis no bairro do usuário correspondente. 
   - **Camada 2 (Outros Bairros):** Somente se a Camada 1 retornar zero (0) ou possuírem menos match, a tela permite explorar vendedores de fora com a interface clara avisando "Esses resultados são de outras localidades."
3. **Ordenação por Distância:** Na Busca, os itens são empurrados para perto do cliente.

## 4. Integração no React
* Os arquivos focais são `ConsumerFeed.tsx` e `SearchPage.tsx`. Onde a engine `array.filter` e `array.sort` atuarão pesadamente nos resultados extraídos para manter a compatibilidade do Supabase Postgres (sem criar novas Views/RPC complexas antes do necessário).
