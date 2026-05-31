import type { Metadata } from "next";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic"; // always fetch latest content from DB


export async function generateMetadata(): Promise<Metadata> {
  const { data } = await (supabase as any)
    .from("site_pages")
    .select("title_bn")
    .eq("slug", "about")
    .maybeSingle();

  const title = data?.title_bn ?? "আমাদের সম্পর্কে";
  return {
    title: `${title} — কিশতী`,
    description: "কিশতী রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র।",
  };
}

export default async function About() {
  const { data } = await (supabase as any)
    .from("site_pages")
    .select("title_bn, body_bn")
    .eq("slug", "about")
    .maybeSingle();

  const title = data?.title_bn ?? "আমাদের সম্পর্কে";
  const body = data?.body_bn;

  return (
    <main className="container max-w-[660px] py-16 flex-1">
      <h1 className="font-bn text-5xl md:text-6xl mb-10">{title}</h1>
      {body ? (
        <div
          className="rich-body font-bn"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : (
        <div className="prose-kisti font-bn max-w-none text-xl leading-relaxed text-muted-foreground">
          <p>
            &apos;কিশতী&apos; রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র। সাহিত্য, ইতিহাস এবং দর্শনের বিভিন্ন শাখায় নতুন ও পুরনো উভয় ধারার চর্চাকে আমরা উৎসাহিত করি।
          </p>
          <p>
            আমাদের উদ্দেশ্য হলো বাংলা ভাষার পাশাপাশি ইংরেজি এবং আরবি ভাষার মেলবন্ধন ঘটানো, এবং একটি সমৃদ্ধ পাঠক ও লেখক সমাজ গড়ে তোলা।
          </p>
        </div>
      )}
    </main>
  );
}
