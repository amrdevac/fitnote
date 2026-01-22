export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-400" />
        </div>
        <span className="text-sm">Memuat...</span>
      </div>
    </div>
  );
}
