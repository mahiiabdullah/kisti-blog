import { Skeleton } from "@/components/ui/skeleton";

export const PostCardSkeleton = ({ primary = false }: { primary?: boolean }) => {
  return (
    <div className={`grid md:grid-cols-12 gap-6 items-start ${primary ? "md:col-span-2 mb-20 pb-20 border-b border-border/60" : ""}`}>
      <div className={`${primary ? "md:col-span-7" : "md:col-span-12"} overflow-hidden bg-paper-deep rounded-sm`}>
        <Skeleton className="w-full aspect-[16/10] rounded-none" />
      </div>
      <div className={primary ? "md:col-span-5" : "md:col-span-12"}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
};

export const PostListSkeleton = ({ count = 4, hasFeatured = false }: { count?: number, hasFeatured?: boolean }) => {
  return (
    <>
      {hasFeatured && (
        <>
          <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-6">◆ Featured</div>
          <PostCardSkeleton primary={true} />
        </>
      )}
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-16 mb-16">
        {Array.from({ length: count }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
};

export const PostPageSkeleton = () => {
  return (
    <article className="container max-w-3xl py-16 flex-1">
      <Skeleton className="h-3 w-24 mb-12" />

      <header className="mb-12 text-center flex flex-col items-center">
        <Skeleton className="h-4 w-20 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-12 w-1/2 mb-8" />
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-3 w-48" />
      </header>

      <figure className="mb-12 -mx-4 md:-mx-12">
        <Skeleton className="w-full aspect-[16/10] rounded-none" />
      </figure>

      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <br />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <br />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  );
};
