# 🛡️ Skill: Protocolo de Sincronização de Maestria (Sovix Sync Master 2.0)

Este protocolo é a lei suprema de sincronização do projeto JotaM. Ele impede "esquecimentos", perda de código de maestria ou envios acidentais de arquivos restritos.

## 🚀 1. Auditoria Temporal e de Estado (Obrigatório)

Antes de qualquer `git push`, o Agente deve realizar:

*   **Identificação de Fantasmas**: `git ls-files --others --exclude-standard`. Identifica arquivos criados que ainda não estão no Git.
*   **Análise de Desvio**: `git status -uno` seguido de `git diff --name-only`. Compara o que foi mexido localmente vs o que o repositório conhece.
*   **Auditoria de Modificação**: Verificar a data de modificação dos arquivos vitais (`SearchPage`, `CartContext`, `ItemDetail`) em relação ao último commit (`git log -n 1 -- <file>`). Se o arquivo local é mais novo, ele DEVE ser catalogado.

## 📋 2. Catálogo de Sincronização Seletiva

O Agente deve manter um registro mental e documental (via `task.md`) de:

### ✅ AUTORIZADOS PARA SUBIR (Sempre Sync)
*   Sistemas de **Busca**, **Favoritos**, **SKU/Variations**, **Métricas** e **Horários**.
*   Novas **Migrações Supabase** e ajuste em `SETUP_MASTER_DATABASE.sql`.
*   Componentes de UI Premium e Atribuições de Localização (`sis-loca.ts`).

### ⛔️ RESTRITOS (Apenas Local)
*   Scripts de teste de carga ou debug (ex: `test_feed.cjs`, `debug_feed.cjs`).
*   Arquivos de logs temporários (ex: `status.log`, `diff.txt`).
*   Configurações que o usuário explicitamente pedir para manter apenas em ambiente de desenvolvimento.

## 🔍 3. Cross-Check de Contexto (Maestria)

Nenhuma tarefa é finalizada sem:
1.  Comparar o Código Local com a `task.md` e `implementation_plan.md`.
2.  Revisar a aba "Review Changes" para ver se toda a maestria de design foi preservada.
3.  Garantir que os ícones (Favoritos) e lógicas de preço (SKU) estão síncronos.

## 🛠️ Procedimento de Push Seguro
```bash
# 1. Auditoria
git status -u 
git diff --stat

# 2. Sincronização Seletiva
git add <arquivos_autorizados>

# 3. Commit de Maestria
git commit -m "feat: [Sistema] - Descricao técnica de Senior"
git push origin main
```

---
*Assinado: Antigravity - Senior Dev 25+ e UX Designer*
