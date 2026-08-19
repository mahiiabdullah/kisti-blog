import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "অনুদান — কিশতী",
  description: "কিশতী রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র। আমাদের কার্যক্রমকে অব্যাহত রাখতে আপনার অনুদান সহায়তা করুন।",
};

export default function DonatePage() {
  return (
    <main className="container max-w-[660px] py-16 flex-1">
      <h1 className="font-bn text-5xl md:text-6xl mb-8">অনুদান</h1>
      
      <div className="prose-kisti font-bn max-w-none text-base leading-relaxed text-muted-foreground mb-10">
        <p>
          &apos;কিশতী&apos; একটি অলাভজনক সাহিত্য ও চিন্তামূলক ব্লগ। রাষ্ট্র, ইতিহাস এবং দর্শনের চর্চাকে অব্যাহত রাখতে ও লেখকদের অনুপ্রাণিত করতে আপনার অনুদান আমাদের সহায়তা করবে।
        </p>
      </div>

      <div className="space-y-6">
        {/* bKash card */}
        <div className="bg-card border border-border p-6 rounded-sm shadow-soft flex items-center justify-between">
          <div>
            <h3 className="font-bn text-xl font-bold text-foreground mb-1">বিকাশ (bKash)</h3>
            <p className="text-sm text-muted-foreground font-en-sans">Personal Account</p>
          </div>
          <div className="text-right">
            <span className="font-en-sans text-lg font-semibold text-accent block">+8801735289060</span>
            <span className="text-xs text-muted-foreground font-bn">সেন্ড মানি করুন</span>
          </div>
        </div>

        {/* Nagad card */}
        <div className="bg-card border border-border p-6 rounded-sm shadow-soft flex items-center justify-between">
          <div>
            <h3 className="font-bn text-xl font-bold text-foreground mb-1">নগদ (Nagad)</h3>
            <p className="text-sm text-muted-foreground font-en-sans">Personal Account</p>
          </div>
          <div className="text-right">
            <span className="font-en-sans text-lg font-semibold text-accent block">+8801735289060</span>
            <span className="text-xs text-muted-foreground font-bn">সেন্ড মানি করুন</span>
          </div>
        </div>

        {/* Bank Account card */}
        <div className="bg-card border border-border p-6 rounded-sm shadow-soft">
          <h3 className="font-bn text-xl font-bold text-foreground mb-2">ব্যাংক অ্যাকাউন্ট (Bank Account)</h3>
          <p className="text-sm text-muted-foreground font-bn leading-relaxed">
            ব্যাংক অ্যাকাউন্টের মাধ্যমে অনুদান পাঠাতে অনুগ্রহ করে আমাদের <a href="/contact" className="text-accent underline hover:text-accent/80">যোগাযোগ</a> পৃষ্ঠার মাধ্যমে সরাসরি মেইল বা মেসেজ করুন। ব্যাংক অ্যাকাউন্টের তথ্য শীঘ্রই এখানে সরাসরি যুক্ত করা হবে।
          </p>
        </div>
      </div>
    </main>
  );
}
