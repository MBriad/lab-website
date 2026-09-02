import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Home shell skeleton (also the fallback for routes without their own). */
export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <Container className="section-pad pt-32">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-6 h-16 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-6 w-full max-w-xl" />
        <div className="mt-10 flex gap-4">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-40" />
        </div>
      </Container>
      <Container className="section-pad">
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/2]" />
          ))}
        </div>
      </Container>
    </div>
  );
}
