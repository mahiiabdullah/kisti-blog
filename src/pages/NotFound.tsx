import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />
      <main className="container max-w-2xl py-32 flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="font-en-sans text-9xl font-bold text-accent/20 mb-4 tracking-tighter">404</h1>
        <h2 className="font-bn text-4xl mb-4">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h2>
        <p className="font-bn text-xl text-muted-foreground mb-12 max-w-md">
          দুঃখিত, আপনি যে পাতাটি খুঁজছেন তা হয়তো সরানো হয়েছে, মুছে ফেলা হয়েছে, অথবা লিংকটি ভুল।
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-accent hover:text-white px-6 py-3 rounded-full font-bn text-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> প্রচ্ছদে ফিরে যান
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
