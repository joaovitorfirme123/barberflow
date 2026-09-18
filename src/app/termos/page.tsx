import Link from "next/link";

export default function TermsPage() {
  const support = process.env.SUPPORT_EMAIL ?? "suporte@exemplo.com";
  return (
    <main className="min-h-screen bg-bg px-5 py-10 text-cream">
      <article className="mx-auto max-w-3xl border border-line bg-bg-card p-6 sm:p-10">
        <p className="font-mono text-[10px] uppercase tracking-wider text-brass">
          Piloto Barberflow
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase">Termos do piloto</h1>
        <div className="mt-7 space-y-5 text-sm leading-7 text-muted">
          <p>
            O Barberflow é disponibilizado em fase piloto para configuração de serviços,
            profissionais, horários e recebimento de agendamentos.
          </p>
          <p>
            A barbearia deve manter seus horários e dados de contato atualizados, conferir a agenda
            operacional e utilizar o serviço de forma legítima. Funcionalidades de pagamento e envio
            automático de mensagens não fazem parte do piloto.
          </p>
          <p>
            Podem ocorrer indisponibilidades durante a evolução do produto. Incidentes e dúvidas
            devem ser comunicados para{" "}
            <a className="text-brass" href={`mailto:${support}`}>
              {support}
            </a>
            .
          </p>
          <p>
            A participação pode ser encerrada mediante solicitação. Antes da exclusão, a barbearia
            poderá solicitar exportação dos dados essenciais. Estes termos devem ser revisados
            juridicamente antes da cobrança ou abertura pública.
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center border border-line px-4 font-display text-xs uppercase text-brass"
        >
          Voltar
        </Link>
      </article>
    </main>
  );
}
