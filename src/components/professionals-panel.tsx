"use client";

import { Check, Edit3, Plus, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

import { PanelFrame, PanelNav } from "@/components/panel-nav";
import type { PanelTenant } from "@/components/tenant-types";

type Service = { id: string; name: string; active: boolean };
type Professional = {
  id: string;
  name: string;
  photoUrl: string | null;
  active: boolean;
  services: { service: Service }[];
};

const emptyForm = { name: "", photoUrl: "", serviceIds: [] as string[] };

export function ProfessionalsPanel({ tenant }: { tenant: PanelTenant }) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/professionals"), fetch("/api/services")])
      .then(async ([professionalsResponse, servicesResponse]) => {
        const professionalsPayload = await professionalsResponse.json();
        const servicesPayload = await servicesResponse.json();
        if (!professionalsResponse.ok) throw new Error(professionalsPayload.error);
        if (!servicesResponse.ok) throw new Error(servicesPayload.error);
        setProfessionals(professionalsPayload.professionals);
        setServices(servicesPayload.services);
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Erro ao carregar dados."),
      )
      .finally(() => setLoading(false));
  }, []);

  function startEdit(professional?: Professional) {
    setError("");
    if (!professional) {
      setForm(emptyForm);
      setEditing("new");
      return;
    }
    setForm({
      name: professional.name,
      photoUrl: professional.photoUrl ?? "",
      serviceIds: professional.services.map((item) => item.service.id),
    });
    setEditing(professional.id);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        editing === "new" ? "/api/professionals" : `/api/professionals/${editing}`,
        {
          method: editing === "new" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            photoUrl: form.photoUrl || null,
            serviceIds: form.serviceIds,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar.");
      const refreshed = await fetch("/api/professionals");
      const refreshedPayload = await refreshed.json();
      setProfessionals(refreshedPayload.professionals);
      setEditing(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(professional: Professional) {
    setBusy(true);
    const response = await fetch(`/api/professionals/${professional.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !professional.active }),
    });
    const payload = await response.json();
    if (!response.ok) setError(payload.error ?? "Não foi possível alterar o profissional.");
    else
      setProfessionals((current) =>
        current.map((item) =>
          item.id === professional.id ? { ...item, active: !item.active } : item,
        ),
      );
    setBusy(false);
  }

  return (
    <PanelFrame>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">Equipe</p>
          <h1 className="mt-2 font-display text-3xl uppercase">Profissionais</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Associe cada profissional aos serviços que ele pode atender.
          </p>
        </div>
        <UserRound className="text-brass" />
      </header>
      <PanelNav />
      {error && (
        <p role="alert" className="mt-5 border border-red/40 bg-red/10 p-3 text-sm text-[#e3a29b]">
          {error}
        </p>
      )}
      <div className="mt-7 flex justify-end">
        <button
          disabled={!tenant.canManage || editing !== null || busy}
          onClick={() => startEdit()}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-brass px-4 font-display text-xs uppercase text-bg"
        >
          <Plus size={16} /> Novo profissional
        </button>
      </div>
      {editing && (
        <form onSubmit={save} className="mt-4 border border-brass/40 bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Nome</span>
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>URL da foto (opcional)</span>
              <input
                type="url"
                value={form.photoUrl}
                onChange={(event) => setForm({ ...form, photoUrl: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <fieldset className="mt-5">
            <legend className={labelClass}>Serviços atendidos</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services
                .filter((service) => service.active)
                .map((service) => (
                  <label
                    key={service.id}
                    className="flex min-h-11 items-center gap-3 border border-line bg-bg px-3 text-sm text-muted"
                  >
                    <input
                      type="checkbox"
                      checked={form.serviceIds.includes(service.id)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          serviceIds: event.target.checked
                            ? [...form.serviceIds, service.id]
                            : form.serviceIds.filter((id) => id !== service.id),
                        })
                      }
                    />
                    {service.name}
                  </label>
                ))}
            </div>
            {!services.length && (
              <p className="mt-2 text-sm text-muted">
                Cadastre um serviço antes de adicionar o profissional.
              </p>
            )}
          </fieldset>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 border border-line px-4 font-display text-xs uppercase text-muted"
            >
              Cancelar
            </button>
            <button
              disabled={busy || !form.serviceIds.length}
              className="min-h-11 bg-brass px-4 font-display text-xs uppercase text-bg"
            >
              {busy ? "Salvando..." : "Salvar profissional"}
            </button>
          </div>
        </form>
      )}
      <div className="mt-5 space-y-3">
        {loading && <p className="py-8 text-sm text-muted">Carregando profissionais...</p>}
        {!loading && !professionals.length && (
          <div className="border border-dashed border-line p-7 text-center">
            <h2 className="font-display text-xl uppercase">Nenhum profissional cadastrado</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Adicione quem realiza os serviços para liberar horários na página pública.
            </p>
          </div>
        )}
        {professionals.map((professional) => (
          <article
            key={professional.id}
            className={`border border-line bg-surface p-4 ${professional.active ? "" : "opacity-55"}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
                <UserRound size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl uppercase">{professional.name}</h2>
                  <span className="rounded-full bg-line px-2 py-1 font-mono text-[9px] uppercase text-muted">
                    {professional.active ? "ativo" : "inativo"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {professional.services.length
                    ? professional.services.map((item) => item.service.name).join(" · ")
                    : "Sem serviços associados"}
                </p>
              </div>
              {tenant.canManage && (
                <div className="flex gap-1">
                  <button
                    aria-label={`Editar ${professional.name}`}
                    onClick={() => startEdit(professional)}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-brass"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    aria-label={`${professional.active ? "Desativar" : "Ativar"} ${professional.name}`}
                    disabled={busy}
                    onClick={() => toggle(professional)}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-brass"
                  >
                    {professional.active ? <X size={18} /> : <Check size={18} />}
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </PanelFrame>
  );
}

const labelClass = "mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted";
const inputClass =
  "w-full border border-line bg-bg px-3 py-3 text-sm text-cream outline-none focus:border-brass focus:ring-1 focus:ring-brass/30";
