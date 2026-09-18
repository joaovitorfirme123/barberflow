"use client";

import { Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    ownerName: "",
    email: "",
    password: "",
    barbershopName: "",
    slug: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? form : { email: form.email, password: form.password, slug: form.slug },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível continuar.");
      router.push("/painel");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="min-h-screen bg-bg px-3 py-3 text-cream sm:px-6 sm:py-8">
      <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-5xl overflow-hidden rounded-[28px] border border-line bg-bg-card shadow-2xl shadow-black/30 lg:grid-cols-[.85fr_1.15fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#29231c_0%,#1b1815_58%,#141210_100%)] p-10 lg:block">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-brass/20" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-brass/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass text-bg">
                <Scissors size={21} />
              </div>
              <div>
                <p className="font-display text-xl uppercase leading-none">Barberflow</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[.25em] text-muted-2">
                  Barber OS / access
                </p>
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
                {isRegister ? "Onboarding / 001" : "Workspace / login"}
              </p>
              <p className="mt-4 max-w-xs font-display text-5xl uppercase leading-[.95] text-cream">
                {isRegister ? "Sua cadeira. Seu ritmo." : "A agenda está te esperando."}
              </p>
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted">
                {isRegister
                  ? "Configure o espaço da sua barbearia e publique um link de agendamento próprio."
                  : "Entre no espaço certo para cuidar da agenda, dos clientes e dos horários da sua barbearia."}
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-2">
              Multi-tenant by design
            </p>
          </div>
        </div>
        <div className="flex items-center p-5 sm:p-10">
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass text-bg">
                  <Scissors size={21} />
                </div>
                <div>
                  <p className="font-display text-xl uppercase leading-none">Barberflow</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[.25em] text-muted-2">
                    Barber OS / access
                  </p>
                </div>
              </div>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
              {isRegister ? "Create workspace" : "Access workspace"}
            </p>
            <h1 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">
              {isRegister ? "Comece pela sua agenda." : "Volte para sua agenda."}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              {isRegister
                ? "Configure sua barbearia e publique seu primeiro link."
                : "Acesse o painel da sua barbearia pelo workspace correto."}
            </p>
            {error && (
              <p
                role="alert"
                className="mt-5 border border-red/40 bg-red/10 px-4 py-3 text-sm leading-5 text-[#e3a29b]"
              >
                {error}
              </p>
            )}
            <form className="mt-7 space-y-4" onSubmit={submit}>
              {isRegister && (
                <>
                  <Field label="Seu nome" htmlFor="ownerName">
                    <input
                      id="ownerName"
                      autoComplete="name"
                      required
                      value={form.ownerName}
                      onChange={(event) => update("ownerName", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Nome da barbearia" htmlFor="barbershopName">
                    <input
                      id="barbershopName"
                      autoComplete="organization"
                      required
                      value={form.barbershopName}
                      onChange={(event) => update("barbershopName", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Link público" htmlFor="slug" hint="Ex.: minha-barbearia">
                    <input
                      id="slug"
                      required
                      placeholder="minha-barbearia"
                      value={form.slug}
                      onChange={(event) => update("slug", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="WhatsApp" htmlFor="phone" hint="Opcional">
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </>
              )}
              {!isRegister && (
                <Field label="Slug da barbearia" htmlFor="slug" hint="O endereço do seu workspace">
                  <input
                    id="slug"
                    required
                    placeholder="minha-barbearia"
                    value={form.slug}
                    onChange={(event) => update("slug", event.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
              <Field label="E-mail" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Senha" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  className={inputClass}
                />
              </Field>
              {isRegister && (
                <p className="-mt-2 text-xs text-muted">Use pelo menos 8 caracteres.</p>
              )}
              <button
                className="flex w-full items-center justify-between rounded-xl bg-red px-5 py-3.5 font-display text-sm uppercase tracking-wider text-cream transition hover:bg-red/80 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                <span>{loading ? "Aguarde..." : isRegister ? "Criar barbearia" : "Entrar"}</span>
                <span className="font-mono text-[10px] text-cream/70">
                  {isRegister ? "01" : "→"}
                </span>
              </button>
            </form>
            <p className="mt-6 text-sm text-muted">
              {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <Link
                className="text-brass underline-offset-4 hover:underline"
                href={isRegister ? "/login" : "/cadastro"}
              >
                {isRegister ? "Entrar" : "Criar agora"}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const inputClass =
  "w-full border border-line bg-surface px-3 py-3 text-sm text-cream outline-none transition placeholder:text-muted-2 focus:border-brass focus:ring-1 focus:ring-brass/30";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-2">
        <span>{label}</span>
        {hint && <span className="normal-case tracking-normal text-muted-2/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
