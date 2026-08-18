import type { Metadata } from "next";
import { supabase } from "@/lib/supabase/client";
import PostPageClient from "./PostPageClient";

interface Props { params: { slug: string } }

// Server-side metadata generation for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data } = await supabase
      .from("posts")
      .select(`slug, cover_url, category_bn, published_at,
               writer:writers!posts_writer_id_fkey(bengali_name),
               post_translations(lang, title, excerpt)`)
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!data) {
      return {
        title: "পৃষ্ঠাটি পাওয়া যায়নি — কিশতী",
        description: "কিশতী — রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র",
      };
    }

    const d = data as any;
    const bn = d.post_translations?.find((t: any) => t.lang === "bn") ?? d.post_translations?.[0];
    const title = bn?.title ?? "কিশতী";
    const description = bn?.excerpt?.slice(0, 160) ?? "কিশতী — রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র";
    const author = d.writer?.bengali_name ?? "কিশতী";
    const url = `https://kisti-next.vercel.app/post/${params.slug}`;
    const image = d.cover_url ?? "https://kisti-next.vercel.app/og-default.png";

    return {
      title: `${title} — কিশতী`,
      description,
      authors: [{ name: author }],
      openGraph: {
        title: `${title} — কিশতী`,
        description,
        type: "article",
        url,
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        publishedTime: d.published_at ?? undefined,
        authors: [author],
        tags: [d.category_bn ?? "কিশতী"],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} — কিশতী`,
        description,
        images: [image],
      },
      alternates: { canonical: url },
    };
  } catch (err) {
    return {
      title: "কিশতী",
      description: "কিশতী — রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র",
    };
  }
}

// JSON-LD structured data
function ArticleJsonLd({ data }: { data: any }) {
  const bn = data.post_translations?.find((t: any) => t.lang === "bn") ?? data.post_translations?.[0];
  const title = bn?.title ?? "কিশতী";
  const description = bn?.excerpt?.slice(0, 200) ?? "";
  const author = data.writer?.bengali_name ?? "কিশতী";
  const url = `https://kisti-next.vercel.app/post/${data.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "কিশতী",
      url: "https://kisti-next.vercel.app",
    },
    datePublished: data.published_at ?? undefined,
    dateModified: data.published_at ?? undefined,
    image: data.cover_url ? [data.cover_url] : [],
    url,
    inLanguage: "bn",
    articleSection: data.category_bn ?? undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function PostPage({ params }: Props) {
  let data = null;
  try {
    const res = await supabase
      .from("posts")
      .select(`slug, cover_url, category_bn, published_at,
               writer:writers!posts_writer_id_fkey(bengali_name),
               post_translations(lang, title, excerpt)`)
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    data = res.data;
  } catch (e) {
    console.error("PostPage server fetch error:", e);
  }

  return (
    <>
      {data && <ArticleJsonLd data={data} />}
      <PostPageClient slug={params.slug} />
    </>
  );
}
