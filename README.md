<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# JotaM

Plataforma de marketplace para condomínios, com autenticação via Supabase, carrinho de compras e integração com pagamento PIX.

**Stack:** React 19 + TypeScript + Vite + TailwindCSS v4 + Supabase

---

## ⚙️ Rodando localmente

**Pré-requisito:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo:
   ```bash
   cp .env.example .env
   ```
   Preencha as variáveis (veja tabela abaixo).

3. Rode a aplicação:
   ```bash
   npm run dev
   ```
   Acesse em: `http://localhost:3000`

### Variáveis de ambiente

| Variável | Onde encontrar | Obrigatória? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | ✅ Sim |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public | ✅ Sim |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) | Opcional |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console | Opcional |

---

## 🚀 Deploy no Vercel

### 1 — Importe o repositório
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository** e selecione `jotaM`

### 2 — Configure as variáveis de ambiente
Na tela de configuração, vá em **Environment Variables** e adicione:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key do Supabase |

> O Vercel detecta projetos Vite automaticamente. Build e output já estão configurados no `vercel.json`.

### 3 — Deploy
Clique em **Deploy**. A cada `git push` na branch `main`, um novo deploy é disparado automaticamente.

### 4 — Configure o domínio no Supabase
Após o deploy, adicione a URL do Vercel (ex: `https://jota-m.vercel.app`) em:

**Supabase → Authentication → URL Configuration → Site URL**

---

## 📁 Estrutura

```
src/
├── views/       # Páginas (Home, Cart, Admin, etc.)
├── components/  # Componentes reutilizáveis
├── context/     # Contextos React (Auth, Cart)
├── hooks/       # Hooks customizados (useAuth)
├── lib/         # Cliente Supabase e utilitários
└── bncdd/       # Migrations SQL do banco de dados
```
