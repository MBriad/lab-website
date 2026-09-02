import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <Container width="wide" className="section-pad pt-28">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-12 w-52" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </Container>
      <Container width="wide" className="section-pad">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="border border-hairline">
              <Skeleton className="aspect-[3/2] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-32" />
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
