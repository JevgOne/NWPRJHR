export default function ProductDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="h-4 w-12 bg-nude-100 rounded" />
        <span className="text-muted">/</span>
        <div className="h-4 w-16 bg-nude-100 rounded" />
        <span className="text-muted">/</span>
        <div className="h-4 w-32 bg-nude-100 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Left: Photo skeleton */}
        <div className="aspect-square bg-nude-100 rounded-2xl" />

        {/* Right: Product info skeleton */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <div className="h-7 w-3/4 bg-nude-100 rounded-lg mb-2" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-blush-100 rounded-md" />
              <div className="h-5 w-20 bg-emerald-50 rounded-md" />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="h-6 w-24 bg-nude-100 rounded" />
            <div className="h-4 w-40 bg-nude-100 rounded" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-nude-100 rounded" />
            <div className="h-4 w-5/6 bg-nude-100 rounded" />
            <div className="h-4 w-4/6 bg-nude-100 rounded" />
          </div>

          {/* Specs */}
          <div className="bg-nude-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-nude-100 rounded-full" />
                <div className="space-y-1">
                  <div className="h-2.5 w-12 bg-nude-100 rounded" />
                  <div className="h-3.5 w-16 bg-nude-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Category features */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <div className="h-3 w-24 bg-amber-100 rounded mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 w-3/4 bg-amber-100 rounded" />
              ))}
            </div>
          </div>

          {/* Add to inquiry skeleton */}
          <div className="bg-white border border-line rounded-2xl p-4 space-y-3">
            <div className="h-5 w-32 bg-nude-100 rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-16 bg-nude-100 rounded-lg" />
              ))}
            </div>
            <div className="h-10 w-full bg-blush-100 rounded-xl" />
          </div>

          {/* Delivery perks */}
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-20 bg-nude-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
