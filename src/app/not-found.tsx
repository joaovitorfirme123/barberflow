import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-cream">
      <div className="w-full max-w-md border border-line bg-bg-card p-7 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-brass">
          Página não encontrada
        </p>
        <h1 className="mt-3 font-display text-3xl uppercase">Confira o endereço</h1>
        <p className="mt-3 text-sm text-muted">
          A página pode ter mudado ou o link está incompleto.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center bg-brass px-5 font-display text-xs uppercase text-bg"
        >
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
