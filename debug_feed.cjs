const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProducts() {
  console.log("--- DEBUGGING PRODUCTS ---");
  const prodSelect = 'id, name, is_active, city, neighborhood, bairros_disponiveis, sellers!products_seller_id_fkey(store_name, username, bairros_atendidos)';
  const { data, error } = await supabase.from('products').select(prodSelect).order('created_at', { ascending: false }).limit(5);

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log(`Found ${data.length} total products (active or not)`);
    data.forEach(p => {
       console.log(`\nProd [${p.id}] - ${p.name}`);
       console.log(`  is_active:`, p.is_active);
       console.log(`  city:`, p.city);
       console.log(`  neighborhood:`, p.neighborhood);
       console.log(`  bairros_disponiveis:`, p.bairros_disponiveis);
       console.log(`  Seller Atende em:`, p.sellers?.bairros_atendidos);
    });
  }
}

debugProducts();
