"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bn mb-4">দুঃখিত, একটি ত্রুটি হয়েছে</h1>
      <p className="text-muted-foreground font-en-sans mb-8">
        Something went wrong. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-foreground text-background font-en-sans text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors"
      >
        Try Again
      </button>
    </main>
  );
}
