"use client";

import { Check, Clock3, Edit3, Plus, Scissors, X } from "lucide-react";
import { useEffect, useState } from "react";

import { money } from "@/components/formatters";
import { PanelFrame, PanelNav } from "@/components/panel-nav";
import type { PanelTenant } from "@/components/tenant-types";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  durationMinutes: number;
  active: boolean;
  professionals: { professional: { name: string } }[];
};

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
};

const emptyForm: ServiceForm = { name: "", description: "", price: "", durationMinutes: "45" };

export function ServicesPanel({ tenant }: { tenant: PanelTenant }) {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error ?? "Não foi possível carregar os serviços.");
        setServices(payload.services);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error ? requestError.message : "Erro ao carregar serviços.",
        );
      });
  }, []);

  function startNew() {
    setError("");
    setForm(emptyForm);
    setEditing("new");
  }

  function startEdit(service: Service) {
    setError("");
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
    });
    setEditing(service.id);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price.replace(",", ".")),
      durationMinutes: Number(form.durationMinutes),
    };
    const response = await fetch(editing === "new" ? "/api/services" : `/api/services/${editing}`, {
      method: editing === "new" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível salvar o serviço.");
      setSaving(false);
      return;
    }
    if (editing === "new") {
      setServices((current) => [
        ...current,
        { ...payload.service, professionals: payload.service.professionals ?? [] },
      ]);
    } else {
      setServices((current) =>
        current.map((service) => (service.id === editing ? { ...service, ...body } : service)),
      );
    }
    setEditing(null);
    setSaving(false);
  }

  async function toggle(service: Service) {
    const response = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível alterar o status do serviço.");
      return;
    }
    setServices((current) =>
      current.map((item) => (item.id === service.id ? { ...item, active: !service.active } : item)),
    );
  }

  return (
    <PanelFrame>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-brass">
            <span className="h-2 w-2 rounded-full bg-brass" /> {tenant.name}
          </div>
          <h1 className="mt-3 font-display text-3xl uppercase">Serviços</h1>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[.25em] text-muted-2">
            Menu / 004
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-brass">
          <Scissors size={18} />
        </div>
      </header>
      <PanelNav />
      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            Catalog / {String(services.length).padStart(2, "0")}
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase">Menu da barbearia</h2>
        </div>
        <button
          disabled={!tenant.canManage || editing !== null}
          onClick={startNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-brass px-4 py-2.5 font-display text-xs uppercase tracking-wider text-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={15} /> Novo serviço
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-5 border border-red/40 bg-red/10 px-4 py-3 text-sm text-[#e3a29b]"
        >
          {error}
        </p>
      )}
      {editing === "new" && (
        <ServiceForm
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
      <div className="mt-6 space-y-3">
        {services.map((service, index) => (
          <div key={service.id}>
            {editing === service.id ? (
              <ServiceForm
                form={form}
                setForm={setForm}
                saving={saving}
                onSave={save}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <article
                className={`ticket border border-dashed border-line bg-surface p-5 ${!service.active ? "opacity-55" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[10px] text-muted-2">0{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl uppercase">{service.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase ${service.active ? "bg-teal/30 text-[#9fc1ca]" : "bg-line text-muted-2"}`}
                      >
                        {service.active && service.professionals.length
                          ? "agendável"
                          : service.active
                            ? "sem profissional"
                            : "inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted">
                      {service.description || "Sem descrição cadastrada."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase text-muted-2">
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={13} /> {service.durationMinutes} min
                      </span>
                      <span className="text-brass">{money(Number(service.price))}</span>
                      <span>{service.professionals.length} profissional(is)</span>
                    </div>
                  </div>
                  {tenant.canManage && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        aria-label={`Editar ${service.name}`}
                        onClick={() => startEdit(service)}
                        className="flex h-11 w-11 items-center justify-center text-muted-2 hover:text-brass"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        aria-label={`${service.active ? "Desativar" : "Ativar"} ${service.name}`}
                        onClick={() => toggle(service)}
                        className="flex h-11 w-11 items-center justify-center text-muted-2 hover:text-brass"
                      >
                        {service.active ? <X size={17} /> : <Check size={17} />}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )}
          </div>
        ))}
        {!services.length && (
          <div className="border-y border-line py-10 text-center">
            <p className="font-display text-xl uppercase">Nenhum serviço cadastrado</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Cadastre o que sua barbearia oferece e depois associe um profissional para publicar
              horários.
            </p>
            <button
              disabled={!tenant.canManage}
              onClick={startNew}
              className="mt-4 min-h-11 bg-brass px-4 font-display text-xs uppercase text-bg"
            >
              Adicionar primeiro serviço
            </button>
          </div>
        )}
      </div>
    </PanelFrame>
  );
}

function ServiceForm({
  form,
  setForm,
  saving,
  onSave,
  onCancel,
}: {
  form: ServiceForm;
  setForm: (form: ServiceForm) => void;
  saving: boolean;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSave}
      className="ticket border border-dashed border-brass/35 bg-surface p-5 shadow-[inset_0_1px_0_rgba(201,154,84,0.08)] sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.22em] text-brass">
            Service editor
          </p>
          <p className="mt-1 font-display text-lg uppercase text-cream">Dados do serviço</p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-2">
          Draft / 004
        </span>
      </div>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={fieldLabelClass}>Nome</span>
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={fieldInputClass}
            placeholder="Ex.: Corte clássico"
          />
        </label>
        <label className="sm:col-span-2">
          <span className={fieldLabelClass}>Descrição</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className={`${fieldInputClass} min-h-24 resize-y`}
            placeholder="O que está incluído no serviço?"
          />
        </label>
        <label>
          <span className={fieldLabelClass}>Preço</span>
          <input
            required
            type="text"
            inputMode="decimal"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            className={fieldInputClass}
            placeholder="55,00"
          />
        </label>
        <label>
          <span className={fieldLabelClass}>Duração (minutos)</span>
          <input
            required
            type="number"
            min={5}
            max={480}
            value={form.durationMinutes}
            onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
            className={fieldInputClass}
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2 font-display text-xs uppercase text-muted hover:text-cream"
        >
          Cancelar
        </button>
        <button
          disabled={saving}
          type="submit"
          className="rounded-lg bg-brass px-4 py-2 font-display text-xs uppercase text-bg disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar serviço"}
        </button>
      </div>
    </form>
  );
}

const fieldLabelClass = "mb-2 block font-mono text-[11px] uppercase tracking-[.16em] text-muted-2";
const fieldInputClass =
  "block w-full rounded-lg border border-line bg-bg px-3.5 py-3 text-[15px] leading-5 text-cream outline-none transition placeholder:text-muted-2 focus:border-brass focus:ring-1 focus:ring-brass/25";
