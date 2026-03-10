# 🛡️ Skill: Protocolo de Sincronização Robusta (Sovix Sync Master)

Este protocolo foi criado para garantir que NENHUMA linha de código de maestria seja perdida no caminho entre o desenvolvimento local e o repositório remoto (GitHub/Vercel).

## 📋 Checklist de Auditoria (Sempre antes do Push)

1.  **Auditoria de Status**:
    *   Executar `git status -u` para identificar arquivos "untracked" (fantasmas).
    *   Executar `git diff --stat` para ver o volume de mudanças não commitadas.

2.  **Verificação de Sistemas Críticos**:
    *   **Busca**: Confirmar melhorias de UX/UI em `SearchPage.tsx`.
    *   **Favoritos**: Validar ícones e lógica em `ItemDetail.tsx` e `ConsumerFeed.tsx`.
    *   **SKU/Cart**: Garantir que o motor dinâmico em `CartContext.tsx` e `CartPage.tsx` está incluído.
    *   **Horários**: Checar automação de "Aberto agora".

3.  **Integridade de Banco**:
    *   Todas as novas migrações em `supabase/migrations/` devem estar rastreadas.
    *   O script `SETUP_MASTER_DATABASE.sql` deve ser atualizado.

4.  **Consolidação de Build**:
    *   Rodar `npx tsc --noEmit` localmente para garantir que o Vercel não vá quebrar por erro de tipo ou importação.

## 🚀 Comando de Sincronização Total
```bash
git add .
git status
git commit -m "feat: Sincronizacao Total Premium - [Sistemas Catalogados]"
git push origin main
```

---
*Assinado: Antigravity - Senior Dev 25+ e UX Designer*
