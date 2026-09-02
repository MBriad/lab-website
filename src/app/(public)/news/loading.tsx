import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsLoading() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <Container className="section-pad pt-28">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-12 w-52" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </Container>
      <Container className="section-pad">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="grid gap-5 border-b border-hairline py-6 sm:grid-cols-[220px_1fr]"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}
