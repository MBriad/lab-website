import { Container } from "@/components/ui/container";
import { Skeleton, SkeletonLines } from "@/components/ui/skeleton";

export default function NewsDetailLoading() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <Container className="pt-28 sm:pt-32">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-8 h-3 w-56" />
        <Skeleton className="mt-4 h-10 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-3 w-40" />
      </Container>
      <Container className="mt-10">
        <Skeleton className="aspect-[21/10] w-full" />
      </Container>
      <Container className="section-pad">
        <div className="max-w-3xl">
          <SkeletonLines rows={6} />
        </div>
      </Container>
    </div>
  );
}
