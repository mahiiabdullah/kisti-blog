import Link from "next/link";

const sections = [
  { label: "ইসলাম ও আধুনিকতা", cat: "ইসলাম ও আধুনিকতা" },
  { label: "শরিয়া ও ফিকহ", cat: "শরিয়া ও ফিকহ" },
  { label: "রাজনৈতিক ইসলাম", cat: "রাজনৈতিক ইসলাম" },
  { label: "ইতিহাস ও সভ্যতা", cat: "ইতিহাস ও সভ্যতা" },
  { label: "তত্ত্ব ও দর্শন", cat: "তত্ত্ব ও দর্শন" },
  { label: "বাংলাদেশ প্রসঙ্গ", cat: "বাংলাদেশ প্রসঙ্গ" },
  { label: "গ্রন্থালোচনা", cat: "গ্রন্থালোচনা" },
];

export const SiteFooter = () => (
  <footer className="border-t border-border/60 mt-24">
    <div className="container max-w-6xl py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
      <div>
        <Link href="/" className="inline-block group">
          <div className="font-bn text-2xl mb-2 group-hover:text-accent transition-colors">কিস্তি</div>
        </Link>
        <p className="text-muted-foreground leading-relaxed font-bn">
          রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র।
          চিন্তার কিস্তি।
        </p>
      </div>
      <div>
        <div className="font-en-sans uppercase text-xs tracking-[0.2em] text-muted-foreground mb-3">
          Sections
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 font-bn-sans">
          {sections.map((s) => (
            <li key={s.cat}>
              <Link
                href={`/?cat=${encodeURIComponent(s.cat)}`}
                className="text-foreground/80 hover:text-accent transition-colors hover:translate-x-1 inline-block transform duration-200"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="font-en-sans uppercase text-xs tracking-[0.2em] text-muted-foreground mb-3">
          Colophon
        </div>
        <p className="text-muted-foreground">
          Set in Noto Serif Bengali, Cormorant Garamond &amp; Amiri.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} কিস্তি · kiSti
        </p>
      </div>
    </div>
  </footer>
);
