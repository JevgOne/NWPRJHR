export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-nude-100 rounded" />
        <div className="h-10 w-24 bg-nude-100 rounded-lg" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 bg-nude-100 rounded-xl" />
      ))}
    </div>
  );
}
