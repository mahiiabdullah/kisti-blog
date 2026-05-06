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
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  console.log("Profiles:", data, error);
}

test();
