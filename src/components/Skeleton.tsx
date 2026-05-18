// Base pulse block
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} />
  );
}

// Movie card skeleton
export function MovieCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="w-full aspect-[2/3] bg-gray-800 animate-pulse" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-gray-800 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-gray-800 rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}

// Grid of movie card skeletons
export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Person card skeleton
export function PersonCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="w-full aspect-[2/3] bg-gray-800 animate-pulse" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-gray-800 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

// Movie detail page skeleton
export function MovieDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Backdrop */}
      <div className="w-full h-56 md:h-80 rounded-2xl bg-gray-800 animate-pulse" />

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-40 aspect-[2/3] rounded-xl bg-gray-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-800 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-800 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-800 rounded animate-pulse w-4/5" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Cast */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-800 rounded animate-pulse w-32" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PersonCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Person detail page skeleton
export function PersonDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-44 h-64 rounded-2xl bg-gray-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-800 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-800 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-800 rounded animate-pulse w-4/5" />
            <div className="h-3 bg-gray-800 rounded animate-pulse w-3/5" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-gray-800 rounded animate-pulse w-32" />
        <MovieGridSkeleton count={10} />
      </div>
    </div>
  );
}

// Home page skeleton
export function HomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="w-full h-64 md:h-96 rounded-2xl bg-gray-800 animate-pulse" />
      <div className="h-6 bg-gray-800 rounded animate-pulse w-48" />
      <MovieGridSkeleton count={10} />
    </div>
  );
}

// My List skeleton
export function MyListSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 bg-gray-800 rounded animate-pulse w-32" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-800 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-gray-800 rounded-lg animate-pulse" />
        <div className="w-48 h-10 bg-gray-800 rounded-lg animate-pulse" />
      </div>
      <MovieGridSkeleton count={10} />
    </div>
  );
}

// Browse page skeleton
export function BrowseSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 bg-gray-800 rounded animate-pulse w-40" />
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-36 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <MovieGridSkeleton count={20} />
    </div>
  );
}

// Search page skeleton
export function SearchSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="h-7 bg-gray-800 rounded animate-pulse w-56" />
      <MovieGridSkeleton count={10} />
    </div>
  );
}

// Profile page skeleton
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-800 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
      <div className="space-y-4">
        <div className="h-6 bg-gray-800 rounded animate-pulse w-40" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
