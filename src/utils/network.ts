/**
 * Utilitário para lidar com falhas de rede intermitentes (ex: TypeError: load failed)
 * Comum em cold starts de serviços como Supabase.
 */

export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    delay: number = 800
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            
            // Só faz o retry se for um erro de rede (TypeError: Load failed)
            // Erros de lógica de negócio (ex: senha errada) não devem ser repetidos
            const isNetworkError = 
                err instanceof TypeError || 
                err.message?.toLowerCase().includes('load failed') ||
                err.message?.toLowerCase().includes('failed to fetch');

            if (!isNetworkError) {
                throw err;
            }

            console.warn(`[Network] Falha na tentativa ${i + 1}. Tentando novamente em ${delay}ms...`, err);
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential-ish backoff
        }
    }

    throw lastError;
}
