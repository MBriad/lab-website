import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div aria-busy="true" aria-label="加载影像记录中">
      <Container width="wide" className="section-pad pt-28">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-4 h-12 w-64" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </Container>
      <Container width="wide" className="section-pad">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden border border-hairline">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
