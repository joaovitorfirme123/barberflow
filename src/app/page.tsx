import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Scissors,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Monte sua barbearia",
    text: "Cadastre serviços, profissionais e horários em poucos minutos.",
    icon: Scissors,
  },
  {
    number: "02",
    title: "Publique seu link",
    text: "Uma página própria para compartilhar no Instagram e no WhatsApp.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Deixe a agenda rodar",
    text: "Seus clientes escolhem o horário e você acompanha tudo no painel.",
    icon: CalendarDays,
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-bg text-cream">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass text-bg">
            <Scissors size={19} />
          </span>
          <span>
            <span className="block font-display text-xl uppercase leading-none">Barberflow</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[.25em] text-muted-2">
              Sistema para barbearias
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden font-display text-xs uppercase tracking-wider text-muted transition hover:text-cream sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg border border-brass px-3.5 py-2 font-display text-xs uppercase tracking-wider text-brass transition hover:bg-brass hover:text-bg"
          >
            Criar conta
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full border border-brass/10" />
        <div className="relative">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.3em] text-brass">
            <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Feito para quem vive da cadeira
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-[3.5rem] uppercase leading-[.92] tracking-tight sm:text-7xl lg:text-[6.4rem]">
            Sua agenda. <span className="text-brass">No seu ritmo.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg">
            O Barberflow organiza horários, clientes e serviços para sua barbearia parecer tão
            afiada quanto o seu acabamento.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="group flex items-center justify-center gap-3 rounded-xl bg-red px-5 py-3.5 font-display text-sm uppercase tracking-wider text-cream transition hover:bg-red/80"
            >
              Começar agora
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/barbearia-demo"
              className="flex items-center justify-center gap-3 rounded-xl border border-line px-5 py-3.5 font-display text-sm uppercase tracking-wider text-muted transition hover:border-brass hover:text-brass"
            >
              Ver página demo
            </Link>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-2">
            Sem marketplace. Sem ruído. Só a sua barbearia.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:ml-auto">
          <div className="absolute -right-3 -top-3 rounded-lg border border-brass/40 bg-bg-card px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-brass sm:-right-6 sm:-top-5">
            Agenda ativa
          </div>
          <div className="ticket border border-dashed border-line bg-bg-card p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="flex items-start justify-between border-b border-line pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.25em] text-muted-2">
                  Agenda de hoje
                </p>
                <p className="mt-2 font-display text-3xl uppercase">Máquina & Navalha</p>
              </div>
              <span className="rounded-full bg-teal/40 px-2.5 py-1 font-mono text-[9px] uppercase text-[#9fc1ca]">
                ativo
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <DemoAppointment time="09:00" name="Lucas Ferreira" service="Corte clássico" active />
              <DemoAppointment time="10:30" name="Mateus Rocha" service="Corte + barba" />
              <DemoAppointment time="13:30" name="André Martins" service="Barba completa" />
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-2">
                03 horários hoje
              </span>
              <span className="font-mono text-sm text-brass">R$ 185,00</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border border-line bg-surface px-4 py-3">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-2">
              <ShieldCheck size={14} className="text-brass" /> Dados isolados por barbearia
            </span>
            <span className="font-mono text-[10px] text-brass">01</span>
          </div>
        </div>
      </section>

      <div className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-line sm:grid-cols-4">
          <Stat value="01" label="agenda em um lugar" />
          <Stat value="24/7" label="link para reservar" />
          <Stat value="0" label="planilhas necessárias" />
          <Stat value="100%" label="sua marca" />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <h2 className="max-w-sm font-display text-4xl uppercase leading-none sm:text-5xl">
              Menos operação. Mais cadeira ocupada.
            </h2>
          </div>
          <div className="grid divide-y divide-line border-y border-line">
            {steps.map(({ number, title, text, icon: Icon }) => (
              <article
                key={number}
                className="grid gap-4 py-6 sm:grid-cols-[60px_1fr_auto] sm:items-center"
              >
                <span className="font-mono text-sm text-brass">{number}</span>
                <div>
                  <h3 className="font-display text-2xl uppercase">{title}</h3>
                  <p className="mt-1 max-w-md text-sm leading-6 text-muted">{text}</p>
                </div>
                <Icon className="hidden text-muted-2 sm:block" size={22} strokeWidth={1.4} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-end lg:px-10 lg:py-24">
          <div>
            <h2 className="max-w-lg font-display text-4xl uppercase leading-none sm:text-6xl">
              A ferramenta certa não aparece. A agenda cheia, sim.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Feature
              icon={CalendarDays}
              title="Agenda viva"
              text="Horários disponíveis sem troca de mensagens."
            />
            <Feature
              icon={UsersRound}
              title="Clientes no contexto"
              text="Histórico simples para reconhecer quem volta."
            />
            <Feature
              icon={Clock3}
              title="Seu funcionamento"
              text="Intervalos, folgas e bloqueios sob controle."
            />
            <Feature
              icon={ShieldCheck}
              title="Cada barbearia, um espaço"
              text="Dados separados e acesso pelo espaço certo."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="relative overflow-hidden rounded-[26px] border border-brass/40 bg-[linear-gradient(120deg,#2a2118_0%,#1b1815_68%)] px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-brass/15" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-5xl uppercase leading-[.9] sm:text-7xl">
              Pronto para abrir a agenda?
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted">
              Crie sua conta, cadastre sua barbearia e compartilhe o primeiro link ainda hoje.
            </p>
            <Link
              href="/cadastro"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-brass px-5 py-3.5 font-display text-sm uppercase tracking-wider text-bg transition hover:bg-brass/80"
            >
              Criar minha barbearia <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Barberflow / agenda para barbearias</span>
          <span className="flex gap-4">
            <Link href="/privacidade" className="hover:text-brass">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-brass">
              Termos
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}

function DemoAppointment({
  time,
  name,
  service,
  active = false,
}: {
  time: string;
  name: string;
  service: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 border px-3 py-3 ${active ? "border-brass/60 bg-brass/10" : "border-line"}`}
    >
      <span className="font-mono text-sm text-brass">{time}</span>
      <span className="h-6 w-px bg-line" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base uppercase">{name}</p>
        <p className="truncate text-[11px] text-muted">{service}</p>
      </div>
      {active && <Check size={15} className="text-brass" />}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <p className="font-mono text-xl text-brass sm:text-2xl">{value}</p>
      <p className="mt-1 max-w-[110px] font-mono text-[9px] uppercase leading-4 tracking-wider text-muted-2">
        {label}
      </p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
}) {
  return (
    <article className="border border-line bg-surface p-5 transition hover:border-brass/60">
      <Icon size={19} className="text-brass" strokeWidth={1.6} />
      <h3 className="mt-8 font-display text-xl uppercase">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted">{text}</p>
    </article>
  );
}
