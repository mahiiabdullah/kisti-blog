export const SiteFooter = () => (
  <footer className="border-t border-border/60 mt-24">
    <div className="container max-w-6xl py-12 grid md:grid-cols-3 gap-8 text-sm">
      <div>
        <div className="font-bn text-2xl mb-2">কিস্তি</div>
        <p className="text-muted-foreground leading-relaxed font-bn">
          রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র।
          চিন্তার কিস্তি।
        </p>
      </div>
      <div>
        <div className="font-en-sans uppercase text-xs tracking-[0.2em] text-muted-foreground mb-3">
          Sections
        </div>
        <ul className="grid grid-cols-2 sm:flex sm:flex-col gap-2 font-bn-sans">
          <li>ইসলাম ও আধুনিকতা</li>
          <li>শরিয়া ও ফিকহ</li>
          <li>রাজনৈতিক ইসলাম</li>
          <li>ইতিহাস ও সভ্যতা</li>
          <li>তত্ত্ব ও দর্শন</li>
        </ul>
      </div>
      <div>
        <div className="font-en-sans uppercase text-xs tracking-[0.2em] text-muted-foreground mb-3">
          Colophon
        </div>
        <p className="text-muted-foreground">
          Set in Noto Serif Bengali, Cormorant Garamond & Amiri.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} কিস্তি · kiSti
        </p>
      </div>
    </div>
  </footer>
);
