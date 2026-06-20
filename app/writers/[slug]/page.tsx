import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";


interface WriterPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: WriterPageProps): Promise<Metadata> {
  const { data: writer } = await supabase
    .from("writers")
    .select("name, bengali_name, bio, profile_image")
    .eq("slug", params.slug)
    .single();

  if (!writer) return { title: "Writer Not Found | Kisti" };

  return {
    title: `${writer.bengali_name} (${writer.name}) | Kisti`,
    description: writer.bio?.substring(0, 160) || `Read literary writings, essays, and articles by ${writer.name}.`,
    openGraph: {
      title: `${writer.bengali_name} | Kisti`,
      description: writer.bio?.substring(0, 160) || `Read literary writings by ${writer.name}.`,
      images: writer.profile_image ? [{ url: writer.profile_image }] : [],
    },
  };
}

export default async function WriterProfilePage({ params }: WriterPageProps) {
  const { data: writer } = await supabase
    .from("writers")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_visible", true)
    .single();

  if (!writer) {
    notFound();
  }

  // Fetch original writings
  const { data: originals } = await supabase
    .from("posts")
    .select(`
      id, slug, cover_url, category_bn, reading_minutes, published_at,
      post_translations!inner(title, excerpt),
      post_stats(view_count)
    `)
    .eq("status", "published")
    .eq("writer_id", writer.id)
    .eq("is_translation", false)
    .eq("post_translations.lang", "bn")
    .order("published_at", { ascending: false });

  // Fetch translated writings where this writer is the translator
  const { data: translations } = await supabase
    .from("posts")
    .select(`
      id, slug, cover_url, category_bn, reading_minutes, published_at,
      post_translations!inner(title, excerpt),
      post_stats(view_count)
    `)
    .eq("status", "published")
    .eq("translator_id", writer.id)
    .eq("is_translation", true)
    .eq("post_translations.lang", "bn")
    .order("published_at", { ascending: false });

  // Calculate total stats
  const totalWritings = (originals?.length || 0) + (translations?.length || 0);
  let totalReads = 0;
  
  const allWorks = [...(originals || []), ...(translations || [])];
  allWorks.forEach((post: any) => {
    if (post.post_stats?.[0]?.view_count) {
      totalReads += post.post_stats[0].view_count;
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <header className="flex flex-col md:flex-row gap-8 items-start mb-16">
        {writer.profile_image ? (
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 relative rounded-full overflow-hidden border border-border">
            <Image 
              src={writer.profile_image} 
              alt={writer.name} 
              fill 
              className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
            />
          </div>
        ) : (
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
            <span className="text-4xl md:text-6xl text-muted-foreground font-bn">{writer.bengali_name.charAt(0)}</span>
          </div>
        )}
        
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-bn mb-2">{writer.bengali_name}</h1>
          <h2 className="text-xl text-muted-foreground font-en-sans tracking-wide uppercase mb-6">{writer.name}</h2>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-en-sans uppercase tracking-widest text-muted-foreground mb-6">
            {writer.nationality && <span>{writer.nationality}</span>}
            {(writer.birth_year || writer.death_year) && (
              <span>
                {writer.birth_year || "?"} — {writer.death_year || "Present"}
              </span>
            )}
          </div>
          
          {writer.bio && (
            <div className="prose prose-sm md:prose-base prose-neutral dark:prose-invert font-bn text-lg leading-relaxed max-w-none">
              <p>{writer.bio}</p>
            </div>
          )}

          <div className="mt-8 flex gap-8 border-t border-border pt-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-en-sans mb-1">Total Works</p>
              <p className="text-2xl font-en-sans">{totalWritings}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-en-sans mb-1">Total Reads</p>
              <p className="text-2xl font-en-sans">{totalReads > 1000 ? `${(totalReads/1000).toFixed(1)}k` : totalReads}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Original Works */}
      {originals && originals.length > 0 && (
        <section className="mb-16">
          <h3 className="text-2xl font-bn mb-8 pb-2 border-b border-border">মৌলিক লেখা <span className="text-sm font-en-sans text-muted-foreground ml-2 uppercase tracking-widest">Original Works</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {originals.map((post: any) => (
              <Link href={`/post/${post.slug}`} key={post.id} className="group flex flex-col gap-3">
                <div className="aspect-[16/9] w-full relative bg-secondary overflow-hidden border border-border">
                  {post.cover_url ? (
                    <Image src={post.cover_url} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                      <img src="/kishti%20logo.png" alt="Kisti Logo" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-widest font-en-sans border border-border">
                    {post.category_bn}
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bn group-hover:text-accent transition-colors line-clamp-2">{post.post_translations[0]?.title}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs font-en-sans text-muted-foreground uppercase tracking-widest">
                    <span>{post.reading_minutes} MIN READ</span>
                    {post.post_stats?.[0]?.view_count ? <span>👁 {post.post_stats[0].view_count}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Translated Works */}
      {translations && translations.length > 0 && (
        <section>
          <h3 className="text-2xl font-bn mb-8 pb-2 border-b border-border">অনুবাদ <span className="text-sm font-en-sans text-muted-foreground ml-2 uppercase tracking-widest">Translated Works</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {translations.map((post: any) => (
              <Link href={`/post/${post.slug}`} key={post.id} className="group flex flex-col gap-3">
                <div className="aspect-[16/9] w-full relative bg-secondary overflow-hidden border border-border">
                  {post.cover_url ? (
                    <Image src={post.cover_url} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                      <img src="/kishti%20logo.png" alt="Kisti Logo" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-widest font-en-sans border border-border">
                    {post.category_bn}
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bn group-hover:text-accent transition-colors line-clamp-2">{post.post_translations[0]?.title}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs font-en-sans text-muted-foreground uppercase tracking-widest">
                    <span>{post.reading_minutes} MIN READ</span>
                    {post.post_stats?.[0]?.view_count ? <span>👁 {post.post_stats[0].view_count}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
