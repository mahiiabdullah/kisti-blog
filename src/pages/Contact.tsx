import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />
      <main className="container max-w-3xl py-16 flex-1">
        <h1 className="font-bn text-5xl md:text-6xl mb-8">যোগাযোগ</h1>
        <div className="prose-kisti font-bn max-w-none text-xl leading-relaxed text-muted-foreground">
          <p>
            যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন। আপনার মতামত, পরামর্শ, বা লেখা পাঠাতে আমাদের ইমেইল করুন।
          </p>
          <p className="mt-8 font-en-sans">
            <strong>Email:</strong> editor@kisti.bd <br />
            <strong>Address:</strong> Dhaka, Bangladesh
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
