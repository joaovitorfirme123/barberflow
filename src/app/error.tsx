"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-cream">
      <div className="w-full max-w-md border border-red/40 bg-bg-card p-7 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#e3a29b]">
          Falha temporária
        </p>
        <h1 className="mt-3 font-display text-3xl uppercase">Não foi possível abrir esta página</h1>
        <p className="mt-3 text-sm text-muted">Verifique sua conexão e tente novamente.</p>
        <button
          onClick={reset}
          className="mt-5 min-h-11 bg-brass px-5 font-display text-xs uppercase text-bg"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
