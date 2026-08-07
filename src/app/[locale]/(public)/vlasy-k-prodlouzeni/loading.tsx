export default function OfferLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
      {/* Title skeleton */}
      <div className="h-8 w-64 bg-nude-100 rounded-lg mb-4" />

      {/* Banner skeleton */}
      <div className="bg-blush-100 border border-blush-200 rounded-xl p-5 mb-8">
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 bg-blush-200 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 bg-blush-200 rounded" />
            <div className="h-4 w-full bg-blush-200 rounded" />
            <div className="h-4 w-32 bg-blush-200 rounded" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 bg-nude-100 rounded-xl mb-4" />

      {/* Category tabs skeleton */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-nude-100 rounded-lg" />
        ))}
      </div>

      {/* Filter panel skeleton */}
      <div className="bg-nude-50 rounded-xl border border-line p-4 mb-6 space-y-3">
        <div className="h-4 w-16 bg-nude-100 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-24 bg-nude-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-line overflow-hidden">
            <div className="aspect-[3/4] bg-nude-100" />
            <div className="p-2.5 space-y-2">
              <div className="h-3 w-16 bg-nude-100 rounded" />
              <div className="h-4 w-full bg-nude-100 rounded" />
              <div className="h-3 w-20 bg-nude-100 rounded" />
              <div className="flex justify-between">
                <div className="h-5 w-14 bg-nude-100 rounded" />
                <div className="h-3 w-10 bg-nude-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
