const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Running query...");
  const prodSelect = 'id, name, price, image_url, category_id, city, neighborhood, bairros_disponiveis, sellers!products_seller_id_fkey(store_name, username, bairros_atendidos)';
  const { data, error } = await supabase.from('products').select(prodSelect).eq('is_active', true).order('created_at', { ascending: false }).limit(200);

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log(`Found ${data.length} products`);
    if (data.length > 0) {
      console.log("First product sample:", JSON.stringify(data[0], null, 2));
    }
  }
}

test();
