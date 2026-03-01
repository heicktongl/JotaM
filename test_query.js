import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/Gabriel/Desktop/jotaM/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("Testando Query de Produtos (sem locais)");
    const { data: all_prods, error: err1 } = await supabase
        .from('products')
        .select('*');

    console.log("Todos os produtos:", all_prods?.length || 0, "Erro:", err1);
    all_prods?.forEach(p => console.log(`- ${p.name} | neighbor: ${p.neighborhood} | active: ${p.is_active}`));

    console.log("\nTestando Query or(neighborhood.is.null...)");
    const { data: loc_prods, error: err2 } = await supabase
        .from('products')
        .select('*')
        .or('neighborhood.ilike.%centro%,neighborhood.is.null');

    console.log("Produtos null/centro:", loc_prods?.length || 0, "Erro:", err2);
    loc_prods?.forEach(p => console.log(`- ${p.name}`));
}

testQuery();
