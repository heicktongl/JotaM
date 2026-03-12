# Ecossistema Arquitetural Sovix (v1.0)
Este documento visa centralizar os conceitos, regras de negócio e o nome oficial de cada grande motor/sistema operando sob o capô do aplicativo Sovix. 

Como um SuperApp hiperlocal, a Sovix se divide em "Engines" e "Sistemas" que lidam com problemas específicos mantendo uma UX fluida e premium.

---

## 1. SIS-LOCA-HIPERLOCAL (Sistema de Localização Blindada)
**Localização:** `src/context/LocationContext.tsx` e filtros do `src/views/ConsumerFeed.tsx`
**Propósito:** Garantir que o Território seja a unidade inegociável do app. 
**Como funciona:**
- Em vez de buscar dados pelo Brasil inteiro, o algoritmo trava **obrigatoriamente** o usuário na cidade em que ele se encontra.
- Permite "Endereço Exato" (condo), "Bairro" (neighborhood) e "Cidade" (city).
- Evita o *Cross-City Bleeding*: Se um usuário busca pelo bairro "Centro", o sistema buscará apenas o "Centro" da cidade correta, impedindo vazamento de outras cidades com bairros homônimos.

---

## 2. SIS (Sovix Intent Search)
**Localização:** `src/lib/sis/` (Fuzzy, Engine, Scorer, Intentions)
**Propósito:** O motor de busca inteligente "Google-like" do app.
**Como funciona:**
- Não usa apenas a clássica busca SQL (`ilike`). Ele corrige erros de digitação (*typos*) na hora (ex: "piza" -> "pizza").
- Busca paralelamente Produtos, Serviços, Lojas (Vitrines) e Prestadores Automotores ao mesmo tempo.
- Ranqueia (Score) os resultados client-side, priorizando a relevância do título, depois relevância da descrição, e por último data de criação ou visualizações.
- Possui auto-completar instantâneo (Suggestions) baseado nos termos mais pesquisados.

---

## 3. MsgZap Eficiente (Motor de Checkout/Leads WhatsApp)
**Localização:** `src/lib/msgZapeficiente.ts`
**Propósito:** Converter intenção de compra sem burocracia, usando o WhatsApp como Bridge.
**Como funciona:**
- Em vez de ter um Gateway de Pagamento próprio e complexo (por ora), o MsgZap formata perfeitamente um pedido ou contratação.
- Ele envia Nome, Produto, Quantidade, Valor Total, e a Localização formatada ("Moro na rua X, bairro Y, quero para hoje").
- Ele resolve o problema principal da UX: não frustrar o vendedor recebendo um "oi, vi na Sovix". O vendedor já recebe o pacote completo da intenção, agilizando o fechamento rápido.

---

## 4. Sistema do Olheiro (Radar Social)
**Localização:** `src/lib/olheiro.ts` e `src/views/ProductView.tsx`
**Propósito:** O pilar da retenção gamificada e viralização (Growth). 
**Como funciona:**
- Todo produto tem um botão de "Indicar". Quando o usuário indica para um amigo fora do app (via link), o Olheiro coloca um *Tracker* (ref).
- Registra views unicamente e marca de que "Boca a Boca" essa venda/visualização veio.
- Permite construir métricas para futuramente recompensar o usuário que mais indicar lojas no bairro (A "Reputação" como moeda invisível).

---

## 5. Theme Engine (Motor de Vitrines Premium)
**Localização:** `src/lib/themeEngine.ts` e `src/lib/themeRegistry.ts`
**Propósito:** Customização estelar (SaaS Style) para que cada vitrine se sinta única.
**Como funciona:**
- As vitrines não são engessadas. O ThemeEngine renderiza cores primárias personalizadas, botões com rádio diferente, cabeçalhos parallax, layouts de grade (grid vs list), e animações dinâmicas.
- O ThemeRegistry guarda todas as configurações estéticas de "temas prontos" para os vendedores, convertendo propriedades JSON em Classes CSS na renderização React.

---

## 6. Cart Context (Ecossistema de Cesta Local)
**Localização:** `src/context/CartContext.tsx` e `src/components/FloatingCart.tsx`
**Propósito:** Manter uma lista de intenções (carrinho/pedidos) sem forçar login antecipado.
**Como funciona:**
- Agrupa produtos por loja. A Sovix sabe que o usuário pode comprar um salgado do "Seu Zé" e uma blusa da "Loja Maria", então o carrinho agrupa e finaliza pedidos loja-a-loja (WhatsApp individual).
- Persiste os dados de modo flexível para não perder conversão se o celular desligar.

---
 
## 7. Sovix Pulse (Motor de Feedback Visual & Transição)
**Localização:** `src/components/LoadingScreen.tsx` e `src/components/Skeleton.tsx`
**Propósito:** Humanizar a espera e garantir a percepção de um app "vivo" e instantâneo.
**Como funciona:**
# Ecossistema Arquitetural Sovix (v1.0)
Este documento visa centralizar os conceitos, regras de negócio e o nome oficial de cada grande motor/sistema operando sob o capô do aplicativo Sovix. 

Como um SuperApp hiperlocal, a Sovix se divide em "Engines" e "Sistemas" que lidam com problemas específicos mantendo uma UX fluida e premium.

---

## 1. SIS-LOCA-HIPERLOCAL (Sistema de Localização Blindada)
**Localização:** `src/context/LocationContext.tsx` e filtros do `src/views/ConsumerFeed.tsx`
**Propósito:** Garantir que o Território seja a unidade inegociável do app. 
**Como funciona:**
- Em vez de buscar dados pelo Brasil inteiro, o algoritmo trava **obrigatoriamente** o usuário na cidade em que ele se encontra.
- Permite "Endereço Exato" (condo), "Bairro" (neighborhood) e "Cidade" (city).
- Evita o *Cross-City Bleeding*: Se um usuário busca pelo bairro "Centro", o sistema buscará apenas o "Centro" da cidade correta, impedindo vazamento de outras cidades com bairros homônimos.

---

## 2. SIS (Sovix Intent Search)
**Localização:** `src/lib/sis/` (Fuzzy, Engine, Scorer, Intentions)
**Propósito:** O motor de busca inteligente "Google-like" do app.
**Como funciona:**
- Não usa apenas a clássica busca SQL (`ilike`). Ele corrige erros de digitação (*typos*) na hora (ex: "piza" -> "pizza").
- Busca paralelamente Produtos, Serviços, Lojas (Vitrines) e Prestadores Automotores ao mesmo tempo.
- Ranqueia (Score) os resultados client-side, priorizando a relevância do título, depois relevância da descrição, e por último data de criação ou visualizações.
- Possui auto-completar instantâneo (Suggestions) baseado nos termos mais pesquisados.

---

## 3. MsgZap Eficiente (Motor de Checkout/Leads WhatsApp)
**Localização:** `src/lib/msgZapeficiente.ts`
**Propósito:** Converter intenção de compra sem burocracia, usando o WhatsApp como Bridge.
**Como funciona:**
- Em vez de ter um Gateway de Pagamento próprio e complexo (por ora), o MsgZap formata perfeitamente um pedido ou contratação.
- Ele envia Nome, Produto, Quantidade, Valor Total, e a Localização formatada ("Moro na rua X, bairro Y, quero para hoje").
- Ele resolve o problema principal da UX: não frustrar o vendedor recebendo um "oi, vi na Sovix". O vendedor já recebe o pacote completo da intenção, agilizando o fechamento rápido.

---

## 4. Sistema do Olheiro (Radar Social)
**Localização:** `src/lib/olheiro.ts` e `src/views/ProductView.tsx`
**Propósito:** O pilar da retenção gamificada e viralização (Growth). 
**Como funciona:**
- Todo produto tem um botão de "Indicar". Quando o usuário indica para um amigo fora do app (via link), o Olheiro coloca um *Tracker* (ref).
- Registra views unicamente e marca de que "Boca a Boca" essa venda/visualização veio.
- Permite construir métricas para futuramente recompensar o usuário que mais indicar lojas no bairro (A "Reputação" como moeda invisível).

---

## 5. Theme Engine (Motor de Vitrines Premium)
**Localização:** `src/lib/themeEngine.ts` e `src/lib/themeRegistry.ts`
**Propósito:** Customização estelar (SaaS Style) para que cada vitrine se sinta única.
**Como funciona:**
- As vitrines não são engessadas. O ThemeEngine renderiza cores primárias personalizadas, botões com rádio diferente, cabeçalhos parallax, layouts de grade (grid vs list), e animações dinâmicas.
- O ThemeRegistry guarda todas as configurações estéticas de "temas prontos" para os vendedores, convertendo propriedades JSON em Classes CSS na renderização React.

---

## 6. Cart Context (Ecossistema de Cesta Local)
**Localização:** `src/context/CartContext.tsx` e `src/components/FloatingCart.tsx`
**Propósito:** Manter uma lista de intenções (carrinho/pedidos) sem forçar login antecipado.
**Como funciona:**
- Agrupa produtos por loja. A Sovix sabe que o usuário pode comprar um salgado do "Seu Zé" e uma blusa da "Loja Maria", então o carrinho agrupa e finaliza pedidos loja-a-loja (WhatsApp individual).
- Persiste os dados de modo flexível para não perder conversão se o celular desligar.

---
 
## 7. Sovix Pulse (Motor de Feedback Visual & Transição)
**Localização:** `src/components/LoadingScreen.tsx` e `src/components/Skeleton.tsx`
**Propósito:** Humanizar a espera e garantir a percepção de um app "vivo" e instantâneo.
**Como funciona:**
- Composto por dois sub-motores: a **Logo Pulsante** (uso em transições pesadas e carregamento inicial) e os **Skeletons Shimmer** (uso em carregamento de conteúdo assíncrono).
- Reduz a carga cognitiva do usuário ao antecipar a estrutura do conteúdo que está sendo carregado.
- Mantém a unidade visual da marca em todos os estados de carregamento da plataforma.

---

## 8. SIS-CONNECT (Motor de Identidade & Sincronização)
**Localização:** `src/hooks/useAuth.ts` e `src/lib/network.ts` (Resilience Layer)
**Propósito:** Garantir que a conexão do usuário com a infraestrutura Sovix seja inquebrável e persistente.
**Como funciona:**
- Gerencia o ciclo de vida da autenticação, garantindo que o perfil (Sellers/Providers) esteja sempre sincronizado.
- Implementa a **Camada de Resiliência**: utiliza o utilitário `withRetry` para mitigar erros de rede intermitentes, garantindo que transações críticas (login, cadastro, vendas) não falhem na primeira tentativa.
- Realiza o *Supabase Warm-up* preventivo no `App.tsx` para eliminar a latência de "frio" da conexão.

---

## 9. SIS-ENGAGE (Sistema de Engajamento & Feedback Social)
**Localização:** `src/lib/engage.ts` e `src/components/PostCard.tsx`
**Propósito:** Criar prova social e fomentar a interação dentro do Território.
**Como funciona:**
- Gerencia **Likes** ( Curtidas) de forma atômica e idempotente no banco.
- Engine de **Comentários** hierárquicos para discussões locais.
- Integração com a **Web Share API** para compartilhamento nativo e viralização (conectado ao Olheiro).
- Proporciona o feedback visual instantâneo (Micro-animations) que reforça a satisfação de interagir com a plataforma.

---

### Os 3 Pilares Mentais Arquiteturais Sovix guardados e aplicados nessas features:
1. **Território** é a unidade estratégica (`SIS-LOCA-HIPERLOCAL`).
2. **Reputação** é a moeda invisível (`SisOlheiro` e `SIS-ENGAGE`).
3. **Retenção** vale mais que aquisição (UX fluida com `SIS`, `Sovix Pulse` e engajamento social).
