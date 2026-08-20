import { supabase } from "@/lib/supabase/client";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "লেখকবৃন্দ — কিশতী",
  description: "কিশতীর সাথে যুক্ত সকল লেখক, প্রাবন্ধিক এবং অনুবাদকদের তালিকা।",
};

export const revalidate = 60; // Revalidate every minute

export default async function WritersDirectoryPage() {
  const { data: writers, error } = await supabase
    .from("writers")
    .select("*")
    .eq("is_visible", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching writers:", error);
  }

  const featuredWriters = writers?.filter((w) => w.is_featured) || [];
  const regularWriters = writers?.filter((w) => !w.is_featured) || [];

  return (
    <>
      <section className="bg-secondary/20 border-b border-border/60 py-8 md:py-12">
        <div className="container max-w-5xl text-center">
          <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-3">
            WRITERS DIRECTORY
          </div>
          <h1 className="font-bn text-5xl md:text-6xl font-bold text-foreground mb-4">
            লেখকবৃন্দ
          </h1>
          <div className="font-en-sans text-sm text-muted-foreground uppercase tracking-widest mb-4">
            WRITERS &amp; CONTRIBUTORS
          </div>
          <p className="font-bn text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            কিশতীর সাথে যুক্ত সকল লেখক, প্রাবন্ধিক এবং অনুবাদকদের তালিকা। 
            তাদের প্রোফাইলে গিয়ে আপনি তাদের সব লেখা একসাথে পড়তে পারবেন।
          </p>
        </div>
      </section>

      <main className="container max-w-5xl py-12 flex-1 space-y-12">
        {/* Featured Writers */}
        {featuredWriters.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bn font-semibold border-b border-border pb-2 text-foreground">
              নির্বাচিত লেখক
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWriters.map((writer) => (
                <WriterCard key={writer.id} writer={writer} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Other Writers */}
        {regularWriters.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bn font-semibold border-b border-border pb-2 text-foreground">
              সকল লেখক
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularWriters.map((writer) => (
                <WriterCard key={writer.id} writer={writer} />
              ))}
            </div>
          </div>
        )}

        {(!writers || writers.length === 0) && (
          <div className="text-center py-20 text-muted-foreground font-bn text-lg bg-card rounded-lg border border-border">
            এখনও কোনো লেখক যুক্ত করা হয়নি।
          </div>
        )}
      </main>
    </>
  );
}

function WriterCard({ writer, featured = false }: { writer: any; featured?: boolean }) {
  return (
    <Link
      href={`/writers/${writer.slug}`}
      className={`group block bg-card rounded-sm border border-border hover:border-gold/50 overflow-hidden transition-all duration-300 hover:shadow-md ${
        featured ? "md:col-span-1" : ""
      }`}
    >
      <div className="p-6 flex flex-col items-center text-center h-full">
        <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-border group-hover:border-gold transition-colors">
          {writer.profile_image ? (
            <Image
              src={writer.profile_image}
              alt={writer.bengali_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-3xl font-bn text-muted-foreground">
                {writer.bengali_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bn font-bold text-foreground group-hover:text-accent transition-colors mb-1">
          {writer.bengali_name}
        </h3>
        <p className="text-xs text-muted-foreground font-en uppercase tracking-wider mb-3">
          {writer.name}
        </p>

        {writer.bio && (
          <p className="text-sm text-muted-foreground font-bn line-clamp-2 mt-auto">
            {writer.bio}
          </p>
        )}
      </div>
    </Link>
  );
}
