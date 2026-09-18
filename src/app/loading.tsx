export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-cream">
      <div className="w-full max-w-sm border border-line bg-bg-card p-7 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-brass" />
        <p className="mt-5 font-display text-xl uppercase">Carregando</p>
        <p className="mt-2 text-sm text-muted">Preparando sua experiência...</p>
      </div>
    </main>
  );
}
