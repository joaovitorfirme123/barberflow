import Link from "next/link";

export default function PrivacyPage() {
  const support = process.env.SUPPORT_EMAIL ?? "suporte@exemplo.com";
  return (
    <main className="min-h-screen bg-bg px-5 py-10 text-cream">
      <article className="mx-auto max-w-3xl border border-line bg-bg-card p-6 sm:p-10">
        <p className="font-mono text-[10px] uppercase tracking-wider text-brass">
          Piloto Barberflow
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase">Aviso de privacidade</h1>
        <div className="mt-7 space-y-5 text-sm leading-7 text-muted">
          <p>
            O Barberflow trata dados de cadastro da barbearia e dados informados para agendamento,
            como nome, telefone, serviço, profissional, data e horário.
          </p>
          <p>
            Esses dados são usados para operar a agenda, apresentar o histórico à barbearia e
            proteger o serviço contra abuso. A barbearia é responsável pelo relacionamento com seus
            clientes; o Barberflow atua como fornecedor da plataforma durante o piloto.
          </p>
          <p>
            Os dados não são vendidos. O acesso é restrito à barbearia correspondente e à operação
            técnica necessária. Registros técnicos podem ser mantidos para segurança e diagnóstico
            sem incluir conteúdo desnecessário.
          </p>
          <p>
            Solicitações de acesso, correção ou exclusão podem ser enviadas para{" "}
            <a className="text-brass" href={`mailto:${support}`}>
              {support}
            </a>
            . Dados necessários para obrigações legais ou prevenção de fraude podem ser preservados
            pelo período aplicável.
          </p>
          <p>Este aviso deve ser revisado juridicamente antes do lançamento comercial.</p>
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
