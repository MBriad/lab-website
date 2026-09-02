import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResearchLoading() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <Container className="section-pad pt-28">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-4 h-12 w-52" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </Container>
      <Container className="section-pad">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="grid gap-6 border-b border-hairline py-10 lg:grid-cols-12">
            <Skeleton className="h-28 w-40 lg:col-span-4" />
            <div className="space-y-4 lg:col-span-8">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}
