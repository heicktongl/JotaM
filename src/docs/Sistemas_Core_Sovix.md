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

### Os 3 Pilares Mentais Arquiteturais Sovix guardados e aplicados nessas features:
1. **Território** é a unidade estratégica (`SIS-LOCA-HIPERLOCAL`).
2. **Reputação** é a moeda invisível (`SisOlheiro`).
3. **Retenção** vale mais que aquisição (UX fluida com `SIS` e customização `ThemeEngine`).
