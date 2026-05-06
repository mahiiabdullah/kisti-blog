import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";
for (const line of env.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim().replace(/^"|"$/g, "");
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) supabaseKey = line.split("=")[1].trim().replace(/^"|"$/g, "");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: posts1, error: err1 } = await supabase.from("posts").select("id, slug, profiles(display_name)").limit(1);
  console.log("With 'profiles':", posts1, err1);

  const { data: posts2, error: err2 } = await supabase.from("posts").select("id, slug, profiles:author_id(display_name)").limit(1);
  console.log("With 'profiles:author_id':", posts2, err2);
}

test();
