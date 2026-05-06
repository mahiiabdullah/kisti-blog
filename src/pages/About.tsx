import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />
      <main className="container max-w-3xl py-16 flex-1">
        <h1 className="font-bn text-5xl md:text-6xl mb-8">আমাদের সম্পর্কে</h1>
        <div className="prose-kisti font-bn max-w-none text-xl leading-relaxed text-muted-foreground">
          <p>
            'কিস্তি' রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র। সাহিত্য, ইতিহাস এবং দর্শনের বিভিন্ন শাখায় নতুন ও পুরনো উভয় ধারার চর্চাকে আমরা উৎসাহিত করি।
          </p>
          <p>
            আমাদের উদ্দেশ্য হলো বাংলা ভাষার পাশাপাশি ইংরেজি এবং আরবি ভাষার মেলবন্ধন ঘটানো, এবং একটি সমৃদ্ধ পাঠক ও লেখক সমাজ গড়ে তোলা।
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
