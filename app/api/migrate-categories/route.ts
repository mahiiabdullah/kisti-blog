import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize a service role client to bypass RLS and access the Admin API
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const slugify = (s: string) => {
    // Basic transliteration for common Bengali words could be added here if needed,
    // but for now we'll handle english names or simple fallback.
    return s.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "") // Remove non-word chars
      .replace(/\s+/g, "-") // Replace spaces with -
      .slice(0, 80);
};

export async function GET(request: Request) {
  try {
    const { data: categories, error } = await supabaseAdmin.from("categories").select("*");
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updates = [];
    for (const cat of categories) {
        if (!cat.slug) {
            // Prefer name_en for the slug, fallback to an ID-based slug if name_en is missing
            // since we can't reliably transliterate Bengali name_bn perfectly without a heavy library.
            let generatedSlug = cat.name_en ? slugify(cat.name_en) : `category-${cat.id.split('-')[0]}`;
            
            // Check for uniqueness (very basic)
            const { data: existing } = await supabaseAdmin.from("categories").select("id").eq("slug", generatedSlug).maybeSingle();
            if (existing && existing.id !== cat.id) {
                generatedSlug = `${generatedSlug}-${cat.id.split('-')[0]}`;
            }

            updates.push({
                id: cat.id,
                slug: generatedSlug
            });
        }
    }

    // Apply updates
    const results = [];
    for (const update of updates) {
        const { error: updateError } = await supabaseAdmin.from("categories").update({ slug: update.slug }).eq("id", update.id);
        if (updateError) {
            results.push({ id: update.id, status: "error", message: updateError.message });
        } else {
            results.push({ id: update.id, status: "success", slug: update.slug });
        }
    }

    return NextResponse.json({ message: "Migration completed", results });
  } catch (err: any) {
    console.error("Migration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
