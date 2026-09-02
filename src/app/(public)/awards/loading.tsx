import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AwardsLoading() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <Container className="section-pad pt-28">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-12 w-52" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </Container>
      <Container className="section-pad">
        <div className="flex gap-2 border-y border-hairline py-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="grid gap-8 border-b border-hairline py-12 lg:grid-cols-[180px_1fr]">
            <Skeleton className="h-20 w-36" />
            <div className="space-y-5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-7 w-80" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}
