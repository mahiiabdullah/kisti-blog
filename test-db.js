import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching categories...");
  const { data: cats } = await supabase.from('categories').select('id, name_bn, parent_id');
  console.log("Categories:", cats);

  console.log("\nFetching post_categories...");
  const { data: pc } = await supabase.from('post_categories').select('*');
  console.log("Post Categories:", pc);

  if (cats && pc) {
      for (const cat of cats) {
          if (cat.name_bn === 'থিওলজি') {
              console.log(`\nTesting homepage logic for 'থিওলজি' (${cat.id}):`);
              
              const { data: catData } = await supabase
                .from("categories")
                .select("id, name_bn")
                .or(`id.eq.${cat.id},parent_id.eq.${cat.id}`);
              
              console.log("catData:", catData);
              const catIds = catData?.map(c => c.id) || [];
              
              const { data: pcData } = await supabase
                .from("post_categories")
                .select("post_id")
                .in("category_id", catIds);
                
              console.log("pcData:", pcData);
              
              const postIds = pcData?.map(p => p.post_id) || [];
              console.log("postIds:", postIds);
              
              if (postIds.length > 0) {
                  const { data: posts } = await supabase
                    .from("posts")
                    .select("id, title:post_translations(title), status")
                    .in("id", postIds)
                    .eq("status", "published");
                  console.log("posts matching:", JSON.stringify(posts, null, 2));
              }
          }
      }
  }
}

test();
