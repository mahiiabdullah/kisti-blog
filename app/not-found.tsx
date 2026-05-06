import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="font-en-sans text-9xl font-bold text-accent/20 mb-4 tracking-tighter">404</h1>
      <h2 className="font-bn text-4xl mb-4">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h2>
      <p className="text-muted-foreground font-en-sans mb-8">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-foreground text-background font-en-sans text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors"
      >
        Return to Home
      </Link>
    </main>
  );
}
