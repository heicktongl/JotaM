# Mapeamento para Banco de Dados (DB)

Este diretório contém o mapeamento de todos os pontos da aplicação que foram preparados para receber integração com um Banco de Dados (Backend/API).

Para encontrar os pontos exatos no código, faça uma busca global (Search) pela tag: **`@DB_TODO`**

## 1. Módulo do Entregador (`DeliveryAdmin.tsx`, `DeliveryAreaSettings.tsx`)

### Perfil do Entregador
- **Onde:** Sidebar e Header (`DeliveryAdmin.tsx`).
- **Por que:** Os dados do entregador (Nome, Veículo, Foto, Avaliação) precisam ser carregados do banco para refletir o usuário logado.
- **Tabela/Entidade Sugerida:** `users` ou `delivery_profiles`.

### Métricas e Ganhos (Stats & Earnings)
- **Onde:** Cartões de "Ganhos Hoje", "Entregas" e "Avaliação" (`DeliveryAdmin.tsx`).
- **Por que:** O saldo financeiro, quantidade de entregas e tendências (+12%) devem ser calculados no backend com base no histórico de pedidos concluídos no dia.
- **Tabela/Entidade Sugerida:** `earnings`, `deliveries`.

### Meta Diária (Daily Goal)
- **Onde:** Seção de progresso dentro do cartão de Ganhos (`DeliveryAdmin.tsx`).
- **Por que:** A meta financeira é uma preferência do usuário que deve persistir entre sessões. Se ele deslogar e logar, a meta deve continuar a mesma.
- **Tabela/Entidade Sugerida:** `delivery_preferences` ou coluna `daily_goal` em `delivery_profiles`.

### Desempenho Semanal (Weekly Chart)
- **Onde:** Gráfico de barras nos Ganhos (`DeliveryAdmin.tsx`).
- **Por que:** Os dados dos últimos 7 dias precisam ser agregados pelo banco de dados para montar o gráfico histórico corretamente.
- **Tabela/Entidade Sugerida:** Query agregada na tabela `earnings`.

### Entrega em Andamento (Active Delivery)
- **Onde:** Cartão central de "Pedido #4092" (`DeliveryAdmin.tsx`).
- **Por que:** Requer um sistema em tempo real (WebSockets/Firebase) para atualizar o status do pedido (Coleta -> A Caminho -> Entregue) e sincronizar com o aplicativo do cliente e do restaurante.
- **Tabela/Entidade Sugerida:** `orders` ou `active_deliveries`.

### Bairros Disponíveis
- **Onde:** Lista `MOCK_NEIGHBORHOODS` (`DeliveryAreaSettings.tsx`).
- **Por que:** A lista de bairros da cidade deve vir do banco de dados, pois a plataforma pode expandir para novas regiões sem precisar atualizar o código do aplicativo.
- **Tabela/Entidade Sugerida:** `neighborhoods` ou `service_areas`.

### Validação de Condomínio (Geofence)
- **Onde:** Função `checkLocation` (`DeliveryAreaSettings.tsx`) e `LocationSelector.tsx`.
- **Por que:** O sistema precisa enviar a latitude/longitude atual do usuário para o backend, que verificará no banco de dados espacial (PostGIS, por exemplo) se ele está dentro do polígono de um condomínio parceiro.
- **AVISO IMPORTANTE [MIGRAÇÃO OBRIGATÓRIA]:** É exigida uma verificação RIGOROSA. Quando o banco de dados estiver disponível, a lógica de simulação atual deve ser totalmente migrada para o backend. A opção "Apenas meu Condomínio" SÓ PODE ser exibida se o entregador estiver fisicamente dentro das coordenadas do complexo.
- **Tabela/Entidade Sugerida:** `condominiums` (com dados geoespaciais).

### Salvar Preferências de Área
- **Onde:** Função `handleSave` (`DeliveryAreaSettings.tsx`).
- **Por que:** Quando o entregador escolhe "Cidade Toda", "Apenas Condomínio" ou bairros específicos, isso dita o algoritmo de roteamento (quais pedidos vão tocar para ele). Isso deve ser salvo no backend imediatamente.
- **Tabela/Entidade Sugerida:** `delivery_areas` ou relacionamento `delivery_profile_neighborhoods`.

---

## 2. Módulo do Consumidor (`ConsumerFeed.tsx`, `SearchPage.tsx`, `ItemDetail.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`, `ProfilePage.tsx`)

### Feed Principal e Busca
- **Onde:** `ConsumerFeed.tsx` e `SearchPage.tsx`.
- **Por que:** Produtos e serviços devem ser carregados dinamicamente com base na localização do usuário, filtros aplicados e disponibilidade do vendedor.
- **Tabela/Entidade Sugerida:** `products`, `services` (com filtros geoespaciais e de status).

### Detalhes do Item
- **Onde:** `ItemDetail.tsx`.
- **Por que:** Ao clicar em um produto/serviço, os dados completos (descrição, preço, vendedor, avaliações) devem ser buscados no banco de dados.
- **Tabela/Entidade Sugerida:** `products`, `services`, `reviews`.

### Checkout e Pagamento
- **Onde:** `CheckoutPage.tsx`.
- **Por que:** O processo de checkout precisa buscar endereços salvos do usuário, criar o pedido no banco de dados e integrar com o gateway de pagamento (Pix/Cartão).
- **Tabela/Entidade Sugerida:** `orders`, `user_addresses`, `payments`.

### Perfil do Usuário
- **Onde:** `ProfilePage.tsx`.
- **Por que:** Carregar dados do usuário logado (nome, foto) e gerenciar a sessão (logout).
- **Tabela/Entidade Sugerida:** `users`, `sessions`.

---

## 3. Módulo do Vendedor/Prestador (`ProductAdmin.tsx`, `AddProduct.tsx`, `ServiceAdmin.tsx`, `ServiceAvailability.tsx`, `SellerProfile.tsx`)

### Dashboard do Vendedor (Produtos)
- **Onde:** `ProductAdmin.tsx`.
- **Por que:** Carregar perfil da loja, métricas agregadas de vendas (receita, clientes) e a lista de produtos ativos do vendedor.
- **Tabela/Entidade Sugerida:** `sellers`, `orders`, `products`.

### Adicionar Produto
- **Onde:** `AddProduct.tsx`.
- **Por que:** Buscar categorias disponíveis e salvar o novo produto (com imagens) associado ao ID do vendedor logado.
- **Tabela/Entidade Sugerida:** `categories`, `products`.

### Dashboard do Prestador (Serviços)
- **Onde:** `ServiceAdmin.tsx`.
- **Por que:** Carregar perfil do prestador, próximos agendamentos e métricas de desempenho.
- **Tabela/Entidade Sugerida:** `service_providers`, `appointments`, `earnings`.

### Configurar Serviço e Disponibilidade
- **Onde:** `ServiceAvailability.tsx`.
- **Por que:** Salvar os detalhes do serviço e a grade de horários de disponibilidade no banco de dados para que os clientes possam agendar.
- **Tabela/Entidade Sugerida:** `services`, `service_availability`.

### Perfil Público do Vendedor (Vitrine/Landing Page)
- **Onde:** `SellerProfile.tsx`.
- **Por que:** Funciona como a loja oficial do vendedor (link na bio, marketing). Precisa buscar dados dinâmicos como: foto de capa, avatar, bio, links sociais (WhatsApp, Instagram), métricas (seguidores, vendas, visualizações), selo de verificação e o produto em destaque (pinned). Além de listar todos os produtos e serviços ativos.
- **Tabela/Entidade Sugerida:** `sellers` (colunas: `bio`, `theme_color`, `whatsapp`, `instagram`, `is_verified`, `pinned_product_id`, `views`), `followers`, `products`, `services`.
- **SEO:** As meta tags (title, description, og:image) devem ser preenchidas dinamicamente no servidor (SSR) ou via `react-helmet-async` para garantir que o link compartilhado gere um preview rico nas redes sociais.
