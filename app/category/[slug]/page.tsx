import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

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

  if (!data) {
    const slugLower = params.slug.toLowerCase();
    if (slugLower.includes("editorial") || slugLower.includes("shompadokiyo") || slugLower.includes("%e0%a6%b8%e0%a6%ae%e0%a6%aa%e0%a6%be%e0%a6%a6%e0%a6%95%e0%a7%80%e0%a6%af%e0%a6%bc")) {
      return {
        title: "Editorial Column (সম্পাদকীয় কলাম) — কিশতী",
        description: "কিশতী সম্পাদকীয় এবং নিয়মিত কলামের নির্বাচিত প্রবন্ধসমূহ।",
      };
    }
    return { title: "Category Not Found | KiSti" };
  }

  return {
    title: `${data.name_bn} — কিশতী`,
    description: data.description || `${data.name_bn} বিষয়ক লেখাসমূহ।`,
    alternates: {
      canonical: `/category/${params.slug}`
    }
  };
}

const renderPostCard = (p: any) => {
  const t = p.post_translations?.[0];
  if (!t) return null;
  const lang = t.lang || "bn";
  const author = p.is_translation
    ? p.translator?.bengali_name || p.translator?.name || "—"
    : p.writers?.bengali_name || p.writers?.name || "—";

  return (
    <Link href={`/post/${p.slug}`} key={p.id} className="group block h-full">
      <article className="bg-card border border-border hover:border-gold/50 transition-all p-5 h-full flex flex-col justify-between">
        <div>
          {/* Cover image or logo+mesh fallback */}
          <div className="overflow-hidden rounded-sm mb-4">
            {p.cover_url ? (
              <Image
                src={p.cover_url}
                alt={t.title}
                width={600}
                height={338}
                className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-[1.03] mix-blend-multiply dark:mix-blend-screen opacity-90"
              />
            ) : (
              <div className="w-full aspect-video relative overflow-hidden bg-[#CFD8E3] rounded-sm transition-transform duration-700 group-hover:scale-[1.02] flex items-center justify-center p-4">
                <img src="/kishti logo.png" alt="" className="w-full h-full object-contain mix-blend-multiply opacity-90" />
              </div>
            )}
          </div>
          <div dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 font-en-sans" dir="ltr">
              {p.published_at && (
                <time>
                  {new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              )}
            </div>
            <h3 className={`font-${lang} text-xl font-bold leading-tight mb-2 group-hover:text-accent transition-colors`}>
              {t.title}
            </h3>
            {t.excerpt && (
              <p className={`font-${lang} text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2`}>
                {t.excerpt}
              </p>
            )}
          </div>
        </div>
        <div className="font-en-sans text-xs text-muted-foreground border-t border-border/40 pt-3 mt-2" dir="ltr">
          <span className="font-bn font-semibold text-foreground/80">{author}</span>
          <span className="mx-2">·</span>
          <span>{p.reading_minutes ?? 5} min read</span>
        </div>
      </article>
    </Link>
  );
};

export default async function CategoryPage({ params }: PageProps) {
  // 1. Fetch the category using the slug
  const { data: rawCatData, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  let catData = rawCatData;
  if (!catData) {
    const slugLower = params.slug.toLowerCase();
    if (
      slugLower.includes("editorial") ||
      slugLower.includes("shompadokiyo") ||
      decodeURIComponent(params.slug).includes("সম্পাদকীয়")
    ) {
      catData = {
        id: "editorial-column",
        name_bn: "Editorial Column (সম্পাদকীয় কলাম)",
        name_en: "Editorial Column",
        slug: params.slug,
        description: "কিশতী সম্পাদকীয় এবং নিয়মিত কলামের নির্বাচিত প্রবন্ধসমূহ।",
        icon_url: null,
        is_active: true,
        parent_id: null,
        is_main: true,
        position: 99,
        created_at: new Date().toISOString(),
      };
    } else {
      notFound();
    }
  }

  // 2. Fetch all child categories if this is a parent category
  const { data: childCats } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", catData.id)
    .order("position", { ascending: true });

  const hasChildCats = childCats && childCats.length > 0;

  // 3. Fetch subcategories with their post previews if subcategories exist
  let subCatSections: { subCat: any; posts: any[] }[] = [];

  if (hasChildCats) {
    subCatSections = await Promise.all(
      childCats.map(async (child) => {
        const { data: pcData } = await supabase
          .from("post_categories")
          .select("post_id")
          .eq("category_id", child.id);

        const pIds = pcData?.map((pc) => pc.post_id) ?? [];

        let childPosts: any[] = [];
        if (pIds.length > 0 || child.name_bn) {
          let query = supabase
            .from("posts")
            .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id, is_translation,
                     post_translations(lang, title, excerpt),
                     post_tags(tag),
                     writers!writer_id(name, bengali_name),
                     translator:writers!translator_id(name, bengali_name)`)
            .eq("status", "published")
            .order("published_at", { ascending: false });

          if (pIds.length > 0) {
            query = query.or(`id.in.(${pIds.join(',')}),category_bn.eq.${child.name_bn}`);
          } else {
            query = query.eq("category_bn", child.name_bn);
          }

          const { data: pData } = await query.limit(6);
          childPosts = pData || [];
        }

        return {
          subCat: child,
          posts: childPosts,
        };
      })
    );
  }

  // 4. Fetch standalone category posts (if single category or for stats)
  let catIdsToSearch = [catData.id];
  if (hasChildCats) {
    catIdsToSearch = [...catIdsToSearch, ...childCats.map((c) => c.id)];
  }

  const { data: pcData } = await supabase
    .from("post_categories")
    .select("post_id")
    .in("category_id", catIdsToSearch);
  
  const postIds = pcData?.map((pc) => pc.post_id) ?? [];

  let standalonePosts: any[] = [];
  if (!hasChildCats) {
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
      standalonePosts = postsData || [];
    }
  }

  return (
    <>
      <section className="bg-secondary/20 border-b border-border/60 py-8 md:py-12">
        <div className="container max-w-5xl text-center">
          <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-3">
            {hasChildCats ? "Main Category" : "Category"}
          </div>
          <h1 className="font-bn text-5xl md:text-6xl font-bold text-foreground mb-4">{catData.name_bn}</h1>
          {catData.name_en && (
            <div className="font-en-sans text-sm text-muted-foreground uppercase tracking-widest mb-4">{catData.name_en}</div>
          )}
          {catData.description && (
            <p className="font-bn text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{catData.description}</p>
          )}

          {/* Subcategories Pill Bar */}
          {hasChildCats && (
            <div className="flex flex-wrap justify-center gap-2 mt-6 pt-4 border-t border-border/40">
              {childCats.map((child) => (
                <Link
                  key={child.id}
                  href={child.slug ? `/category/${child.slug}` : `#`}
                  className="text-xs font-bn px-4 py-1.5 bg-card hover:bg-gold hover:text-primary border border-border rounded-full transition-all shadow-sm font-semibold"
                >
                  {child.name_bn}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="container max-w-5xl py-12 flex-1">
        {hasChildCats ? (
          <div className="space-y-16">
            {subCatSections.map(({ subCat, posts: subPosts }) => (
              <section key={subCat.id} className="border-b border-border/60 pb-14 last:border-b-0">
                <div className="flex items-center justify-between mb-8 pb-3 border-b-2 border-gold/40">
                  <div>
                    <span className="text-[10px] uppercase font-en-sans tracking-widest text-gold block mb-0.5">উপ-ক্যাটাগরি</span>
                    <h2 className="font-bn text-2xl md:text-3xl font-bold text-foreground">
                      <Link href={subCat.slug ? `/category/${subCat.slug}` : "#"} className="hover:text-gold transition-colors">
                        {subCat.name_bn}
                      </Link>
                    </h2>
                  </div>
                  <Link
                    href={subCat.slug ? `/category/${subCat.slug}` : "#"}
                    className="text-xs font-bn text-gold hover:underline flex items-center gap-1 font-semibold"
                  >
                    সবকটি প্রবন্ধ দেখুন →
                  </Link>
                </div>

                {subPosts.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border/60 rounded">
                    <p className="font-bn text-muted-foreground text-sm">এই উপ-ক্যাটাগরিতে এখনো কোনো লেখা প্রকাশিত হয়নি।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subPosts.map((p) => renderPostCard(p))}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex justify-end items-baseline mb-8">
              <span className="font-en italic text-sm text-muted-foreground">{standalonePosts.length} {standalonePosts.length === 1 ? "piece" : "pieces"}</span>
            </div>

            {standalonePosts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-lg">
                <p className="font-bn text-muted-foreground text-lg">এখনো কোনো লেখা প্রকাশিত হয়নি।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standalonePosts.map((p) => renderPostCard(p))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
