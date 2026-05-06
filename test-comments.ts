import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";
for (const line of env.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) supabaseKey = line.split("=")[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: posts } = await supabase.from("posts").select("id, slug").limit(5);
  console.log("Posts:", posts);

  if (posts && posts.length > 0) {
    const postId = posts[0].id;
    const { data, error } = await supabase
      .from("comments")
      .select("id, body, created_at, approved, user_id, profiles(display_name, display_name_bn)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    
    console.log("Comments Data with `profiles`:", data);
    console.log("Comments Error with `profiles`:", error);

    const { data: data2, error: error2 } = await supabase
      .from("comments")
      .select("id, body, created_at, approved, user_id, profiles:user_id(display_name, display_name_bn)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    console.log("Comments Data with `profiles:user_id`:", data2);
    console.log("Comments Error with `profiles:user_id`:", error2);
  }
}

test();
