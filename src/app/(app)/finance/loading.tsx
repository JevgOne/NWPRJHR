export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-nude-100 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-nude-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-nude-100 rounded-xl" />
    </div>
  );
}
