export const SkeletonCard = () => (
  <div className="bg-white p-4 animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="mt-4 h-5 w-2/3 bg-gray-200" />
    <div className="mt-2 h-4 w-1/2 bg-gray-200" />
  </div>
);

export const SkeletonGrid = ({ count }: { count: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
