// Shared loading skeletons for route-level loading.tsx boundaries.
// Rendered inside <main> which already has pt-16 for the fixed header.

export function SkeletonHero() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-12 pt-10">
      <div className="shimmer h-8 w-40 rounded-lg" />
      <div className="shimmer mt-4 h-10 w-full max-w-lg rounded-xl" />
      <div className="shimmer mt-3 h-4 w-full max-w-md rounded-md" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <div className="shimmer size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="shimmer h-3.5 w-2/3 rounded-md" />
          <div className="shimmer h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <div className="shimmer mt-5 h-3 w-full rounded-md" />
      <div className="shimmer mt-2 h-3 w-4/5 rounded-md" />
      <div className="mt-5 flex items-center justify-between">
        <div className="shimmer h-3 w-20 rounded-md" />
        <div className="shimmer h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <SkeletonHero />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
      <div className="shimmer size-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-3 w-1/3 rounded-md" />
        <div className="shimmer h-3 w-1/2 rounded-md" />
      </div>
      <div className="shimmer h-6 w-16 rounded-md" />
    </div>
  );
}

export function SkeletonRowList({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24">
      <SkeletonHero />
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
