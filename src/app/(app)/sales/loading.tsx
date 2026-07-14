export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-nude-100 rounded" />
        <div className="h-10 w-28 bg-nude-100 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-10 bg-nude-200 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-nude-100 rounded" />
        ))}
      </div>
    </div>
  );
}
