/** A grey block pulsing where something is still on its way; `className` gives it its size. */
export const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div aria-hidden="true" className={`bg-gray-200 animate-pulse ${className}`} />
);

const SkeletonCard = () => (
  <div className="bg-white p-4 animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="mt-4 h-5 w-2/3 bg-gray-200" />
    <div className="mt-2 h-4 w-1/2 bg-gray-200" />
  </div>
);

/** The list's grid, card-shaped, so nothing jumps when the real cards land. */
export const SkeletonGrid = ({ count }: { count: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

/** A move's body: two chips, three numbers, a sentence. */
export const SkeletonMoveBody = () => (
  <div className="space-y-4" aria-hidden="true">
    <div className="flex gap-2">
      <SkeletonBlock className="h-6 w-24" />
      <SkeletonBlock className="h-6 w-20" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      <SkeletonBlock className="h-16" />
      <SkeletonBlock className="h-16" />
      <SkeletonBlock className="h-16" />
    </div>
    <SkeletonBlock className="h-8" />
  </div>
);
