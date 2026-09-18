"use client";

import { Copy, ExternalLink, Info, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PanelFrame, PanelNav } from "@/components/panel-nav";
import type { PanelTenant } from "@/components/tenant-types";

type ShopForm = {
  name: string;
  slug: string;
  phone: string;
  address: string;
  instagram: string;
  logoUrl: string;
  timezone: string;
  minBookingNoticeMinutes: number;
  maxBookingDays: number;
  slotIntervalMinutes: number;
  slotMode: "FIXED" | "FLEXIBLE";
};

export function SettingsPanel({ tenant }: { tenant: PanelTenant }) {
  const router = useRouter();
  const [form, setForm] = useState<ShopForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const publicPath = `/${form?.slug ?? tenant.slug}`;

  useEffect(() => {
    fetch("/api/barbershop")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        const shop = payload.barbershop;
        setForm({
          name: shop.name,
          slug: shop.slug,
          phone: shop.phone ?? "",
          address: shop.address ?? "",
          instagram: shop.instagram ?? "",
          logoUrl: shop.logoUrl ?? "",
          timezone: shop.timezone,
          minBookingNoticeMinutes: shop.minBookingNoticeMinutes,
          maxBookingDays: shop.maxBookingDays,
          slotIntervalMinutes: shop.slotIntervalMinutes,
          slotMode: shop.slotMode,
        });
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error ? requestError.message : "Erro ao carregar configurações.",
        ),
      );
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/barbershop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          address: form.address || null,
          instagram: form.instagram || null,
          logoUrl: form.logoUrl || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar.");
      setMessage("Configurações salvas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
    setMessage("Link público copiado.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <PanelFrame>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            Conta e publicação
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase">Configurações</h1>
        </div>
        <Settings className="text-brass" />
      </header>
      <PanelNav />
      {error && (
        <p role="alert" className="mt-5 border border-red/40 bg-red/10 p-3 text-sm text-[#e3a29b]">
          {error}
        </p>
      )}
      {message && (
        <p
          aria-live="polite"
          className="mt-5 border border-brass/40 bg-brass/10 p-3 text-sm text-brass"
        >
          {message}
        </p>
      )}
      {!form && !error && <p className="py-10 text-sm text-muted">Carregando configurações...</p>}
      {form && (
        <>
          <section className="mt-7 border border-brass/30 bg-brass/10 p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-brass">
              Sua página pública
            </p>
            <p className="mt-2 break-all text-sm text-cream">{publicPath}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={copyLink}
                className="flex min-h-11 items-center gap-2 bg-brass px-4 font-display text-xs uppercase text-bg"
              >
                <Copy size={15} /> Copiar link
              </button>
              <a
                href={publicPath}
                target="_blank"
                className="flex min-h-11 items-center gap-2 border border-line px-4 font-display text-xs uppercase text-muted hover:text-brass"
              >
                <ExternalLink size={15} /> Abrir página
              </a>
            </div>
          </section>
          <form onSubmit={save} className="mt-5 space-y-7">
            <section>
              <h2 className="font-display text-xl uppercase">Dados da barbearia</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Slug do link">
                  <input
                    required
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="WhatsApp">
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Instagram">
                  <input
                    value={form.instagram}
                    onChange={(event) => setForm({ ...form, instagram: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Endereço">
                  <input
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="URL do logo">
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Timezone">
                  <input
                    required
                    value={form.timezone}
                    onChange={(event) => setForm({ ...form, timezone: event.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>
            <section>
              <h2 className="font-display text-xl uppercase">Regras de agendamento</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field
                  label="Antecedência mínima (minutos)"
                  help="Define com quanto tempo de antecedência o cliente precisa marcar. Ex.: 60 minutos impede reservas para os próximos 60 minutos."
                >
                  <input
                    type="number"
                    min={0}
                    max={10080}
                    value={form.minBookingNoticeMinutes}
                    onChange={(event) =>
                      setForm({ ...form, minBookingNoticeMinutes: Number(event.target.value) })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Limite de agendamento (dias)"
                  help="Define até quantos dias no futuro o cliente pode escolher. Ex.: 60 permite marcar até 60 dias a partir de hoje."
                >
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.maxBookingDays}
                    onChange={(event) =>
                      setForm({ ...form, maxBookingDays: Number(event.target.value) })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Intervalo entre horários (minutos)"
                  help="Define de quanto em quanto tempo um novo atendimento pode começar. Ex.: 30 minutos cria horários às 09:00, 09:30 e 10:00."
                >
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={form.slotIntervalMinutes}
                    onChange={(event) =>
                      setForm({ ...form, slotIntervalMinutes: Number(event.target.value) })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Liberação de horários"
                  help="Flexível também libera o término de um atendimento como próximo horário. Fixo mantém somente a grade definida acima."
                >
                  <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Modo de liberação de horários">
                    <SlotModeOption
                      active={form.slotMode === "FLEXIBLE"}
                      title="Flexível"
                      description="Aproveita o fim real dos atendimentos"
                      onClick={() => setForm({ ...form, slotMode: "FLEXIBLE" })}
                    />
                    <SlotModeOption
                      active={form.slotMode === "FIXED"}
                      title="Fixo"
                      description="Segue apenas a grade configurada"
                      onClick={() => setForm({ ...form, slotMode: "FIXED" })}
                    />
                  </div>
                </Field>
              </div>
            </section>
            <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
              <button
                type="button"
                onClick={logout}
                className="flex min-h-11 items-center gap-2 border border-red/40 px-4 font-display text-xs uppercase text-[#e3a29b]"
              >
                <LogOut size={15} /> Sair
              </button>
              <button
                disabled={saving || !tenant.canManage}
                className="min-h-11 bg-brass px-5 font-display text-xs uppercase text-bg"
              >
                {saving ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>
        </>
      )}
    </PanelFrame>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const helpId = `help-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</span>
        {help && (
          <button
            type="button"
            aria-label={`Sobre ${label}`}
            aria-expanded={showHelp}
            aria-controls={helpId}
            onClick={() => setShowHelp((current) => !current)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-2 hover:bg-brass/10 hover:text-brass"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      {children}
      {help && showHelp && (
        <p id={helpId} className="mt-2 border-l-2 border-brass/50 pl-3 text-xs leading-5 text-muted-2">
          {help}
        </p>
      )}
    </div>
  );
}

function SlotModeOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[76px] border px-3 py-3 text-left transition ${active ? "border-brass bg-brass/10 text-cream shadow-[inset_0_0_0_1px_rgba(201,154,84,0.2)]" : "border-line bg-surface text-muted hover:border-muted"}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-base uppercase">{title}</span>
        <span className={`h-3 w-3 rounded-full border ${active ? "border-brass bg-brass" : "border-muted-2"}`} />
      </span>
      <span className="mt-1 block text-xs leading-4 text-muted-2">{description}</span>
    </button>
  );
}

const inputClass =
  "w-full border border-line bg-surface px-3 py-3 text-sm text-cream outline-none focus:border-brass focus:ring-1 focus:ring-brass/30";
