import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from 'next'

export const revalidate = 60; // revalidate every minute

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { data } = await supabase
    .from("categories")
    .select("name_bn, name_en, description, slug")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Category Not Found | KiSti" };

  return {
    title: `${data.name_bn} — কিশতী`,
    description: data.description || `${data.name_bn} বিষয়ক লেখাসমূহ।`,
    alternates: {
      canonical: `/category/${params.slug}`
    }
  }
}

export default async function CategoryPage({ params }: PageProps) {
  // 1. Fetch the category using the slug
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (catError || !catData) {
    notFound();
  }

  // 2. Fetch all child categories if this is a main category
  let catIdsToSearch = [catData.id];
  const { data: childCats } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", catData.id);
  
  if (childCats && childCats.length > 0) {
    catIdsToSearch = [...catIdsToSearch, ...childCats.map((c) => c.id)];
  }

  // 3. Find post IDs mapped to these categories
  const { data: pcData } = await supabase
    .from("post_categories")
    .select("post_id")
    .in("category_id", catIdsToSearch);
  
  const postIds = pcData?.map((pc) => pc.post_id) ?? [];

  // 4. Fetch the posts.
  // We also fallback to legacy `category_bn` matching to ensure backward compatibility
  // until the data migration is fully complete.
  let posts: any[] = [];
  if (postIds.length > 0 || catData.name_bn) {
    let query = supabase
      .from("posts")
      .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id, is_translation,
               post_translations(lang, title, excerpt),
               post_tags(tag),
               writers!writer_id(name, bengali_name),
               translator:writers!translator_id(name, bengali_name)`)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (postIds.length > 0) {
       query = query.or(`id.in.(${postIds.join(',')}),category_bn.eq.${catData.name_bn}`);
    } else {
       query = query.eq("category_bn", catData.name_bn);
    }

    const { data: postsData } = await query.limit(20);
    posts = postsData || [];
  }

  return (
    <>
      <section className="bg-secondary/20 border-b border-border/60 py-16">
        <div className="container max-w-4xl text-center">
          <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-4">Category</div>
          <h1 className="font-bn text-5xl md:text-6xl text-foreground mb-4">{catData.name_bn}</h1>
          {catData.name_en && (
            <div className="font-en-sans text-sm text-muted-foreground uppercase tracking-widest mb-6">{catData.name_en}</div>
          )}
          {catData.description && (
             <p className="font-bn text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{catData.description}</p>
          )}
        </div>
      </section>

      <main className="container max-w-4xl py-16 flex-1">
        <div className="flex justify-between items-baseline mb-12">
           <h2 className="font-bn text-2xl">এই ক্যাটাগরির লেখাসমূহ</h2>
           <span className="font-en italic text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "piece" : "pieces"}</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="font-bn text-muted-foreground text-lg">এখনো কোনো লেখা প্রকাশিত হয়নি।</p>
          </div>
        ) : (
          <div className="grid gap-12">
            {posts.map((p) => {
              const t = p.post_translations[0];
              if (!t) return null;
              const lang = t.lang || "bn";
              const author = p.is_translation
                ? p.translator?.bengali_name || p.translator?.name || "—"
                : p.writers?.bengali_name || p.writers?.name || "—";
              return (
                <Link href={`/post/${p.slug}`} key={p.id} className="group block">
                  <article className="grid md:grid-cols-12 gap-6 items-center">
                    {p.cover_url && (
                      <div className="md:col-span-5 overflow-hidden bg-paper-deep rounded-sm">
                        <Image
                          src={p.cover_url}
                          alt={t.title}
                          width={600}
                          height={338}
                          className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-[1.02] mix-blend-multiply dark:mix-blend-screen opacity-90"
                        />
                      </div>
                    )}
                    <div className="md:col-span-7" dir={lang === "ar" ? "rtl" : "ltr"}>
                      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 font-en-sans" dir="ltr">
                        {p.published_at && <time>{new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>}
                      </div>
                      <h3 className={`font-${lang} text-2xl leading-tight mb-3 group-hover:text-accent transition-colors`}>
                        {t.title}
                      </h3>
                      {t.excerpt && (
                        <p className={`font-${lang} text-muted-foreground leading-relaxed mb-4 line-clamp-2`}>{t.excerpt}</p>
                      )}
                      <div className="font-en-sans text-xs text-muted-foreground" dir="ltr">
                        <span className="font-bn">{author}</span>
                        <span className="mx-2">·</span>
                        <span>{p.reading_minutes ?? 5} min read</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
