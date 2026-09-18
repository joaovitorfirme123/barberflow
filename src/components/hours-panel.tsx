"use client";

import { Calendar, CalendarOff, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { PanelFrame, PanelNav } from "@/components/panel-nav";
import { BrazilianDateInput } from "@/components/brazilian-date-input";
import type { PanelTenant } from "@/components/tenant-types";

const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const shortDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

type BusinessHour = {
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
};

type ScheduleBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  professionalId: string | null;
};

type Professional = { id: string; name: string; active: boolean };

function todayInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function HoursPanel({ tenant }: { tenant: PanelTenant }) {
  const [schedule, setSchedule] = useState<BusinessHour[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const today = todayInTimeZone(tenant.timezone);
  const [blockForm, setBlockForm] = useState({
    startDate: today,
    startTime: "09:00",
    endDate: today,
    endTime: "10:00",
    professionalId: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [savingHours, setSavingHours] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/business-hours"),
      fetch("/api/schedule-blocks"),
      fetch("/api/professionals"),
    ])
      .then(async ([hoursResponse, blocksResponse, professionalsResponse]) => {
        const hoursPayload = await hoursResponse.json();
        const blocksPayload = await blocksResponse.json();
        const professionalsPayload = await professionalsResponse.json();
        if (!hoursResponse.ok)
          throw new Error(hoursPayload.error ?? "Não foi possível carregar os horários.");
        if (!blocksResponse.ok)
          throw new Error(blocksPayload.error ?? "Não foi possível carregar os bloqueios.");
        if (!professionalsResponse.ok)
          throw new Error(
            professionalsPayload.error ?? "Não foi possível carregar os profissionais.",
          );
        setSchedule(hoursPayload.hours);
        setBlocks(blocksPayload.blocks);
        setProfessionals(professionalsPayload.professionals);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error ? requestError.message : "Erro ao carregar horários.",
        );
      });
  }, []);

  function updateDay(weekday: number, patch: Partial<BusinessHour>) {
    setSchedule((current) =>
      current.map((item) => (item.weekday === weekday ? { ...item, ...patch } : item)),
    );
  }

  async function saveHours() {
    if (!tenant.canManage) return;
    setSavingHours(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/business-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: schedule }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível salvar os horários.");
    } else {
      setSchedule(payload.hours);
      setMessage("Horários de funcionamento salvos.");
    }
    setSavingHours(false);
  }

  async function addBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingBlock(true);
    setError("");
    const response = await fetch("/api/schedule-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...blockForm,
        professionalId: blockForm.professionalId || null,
        reason: blockForm.reason || null,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível criar o bloqueio.");
      setSavingBlock(false);
      return;
    }
    setBlocks((current) =>
      [...current, payload.block].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
    setBlockForm({
      startDate: today,
      startTime: "09:00",
      endDate: today,
      endTime: "10:00",
      professionalId: "",
      reason: "",
    });
    setShowBlockForm(false);
    setMessage("Bloqueio criado.");
    setSavingBlock(false);
  }

  async function removeBlock(id: string) {
    if (!window.confirm("Remover este bloqueio? O intervalo voltará a aceitar agendamentos."))
      return;
    const response = await fetch(`/api/schedule-blocks/${id}`, { method: "DELETE" });
    if (response.ok) {
      setBlocks((current) => current.filter((block) => block.id !== id));
      setMessage("Bloqueio removido.");
    } else {
      const payload = await response.json();
      setError(payload.error ?? "Não foi possível remover o bloqueio.");
    }
  }

  return (
    <PanelFrame>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-brass">
            <span className="h-2 w-2 rounded-full bg-brass" /> {tenant.name}
          </div>
          <h1 className="mt-3 font-display text-3xl uppercase">Horários</h1>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[.25em] text-muted-2">
            Settings / 003
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-3 py-2 font-mono text-[10px] text-muted">
          {tenant.timezone}
        </div>
      </header>
      <PanelNav />
      {error && (
        <p
          role="alert"
          className="mt-5 border border-red/40 bg-red/10 px-4 py-3 text-sm text-[#e3a29b]"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          aria-live="polite"
          className="mt-5 border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-brass"
        >
          {message}
        </p>
      )}
      <section className="mt-8">
        <div className="mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            Weekly rhythm
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase">Funcionamento</h2>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {schedule.map((item) => (
            <div
              key={item.weekday}
              className="grid gap-3 py-4 sm:grid-cols-[52px_1fr_auto] sm:items-center"
            >
              <div>
                <span
                  className={`font-mono text-[10px] ${!item.closed ? "text-brass" : "text-muted-2"}`}
                >
                  {shortDays[item.weekday]}
                </span>
                <span className="ml-3 font-display text-base uppercase sm:hidden">
                  {weekDays[item.weekday]}
                </span>
              </div>
              <div>
                <span className="hidden font-display text-base uppercase sm:block">
                  {weekDays[item.weekday]}
                </span>
                {!item.closed && (
                  <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <TimeField
                      label="Abre"
                      value={item.openTime}
                      onChange={(openTime) => updateDay(item.weekday, { openTime })}
                    />
                    <TimeField
                      label="Fecha"
                      value={item.closeTime}
                      onChange={(closeTime) => updateDay(item.weekday, { closeTime })}
                    />
                    <TimeField
                      label="Pausa"
                      value={item.breakStart ?? ""}
                      optional
                      onChange={(breakStart) =>
                        updateDay(item.weekday, { breakStart: breakStart || null })
                      }
                    />
                    <TimeField
                      label="Retorno"
                      value={item.breakEnd ?? ""}
                      optional
                      onChange={(breakEnd) =>
                        updateDay(item.weekday, { breakEnd: breakEnd || null })
                      }
                    />
                  </div>
                )}
              </div>
              <button
                aria-label={`Alternar ${weekDays[item.weekday]}`}
                disabled={!tenant.canManage}
                onClick={() => updateDay(item.weekday, { closed: !item.closed })}
                className={`relative h-11 w-14 justify-self-end rounded-full p-1.5 transition ${!item.closed ? "bg-brass" : "bg-surface ring-1 ring-line"}`}
              >
                <span
                  className={`block h-8 w-8 rounded-full bg-cream transition-transform ${!item.closed ? "translate-x-3" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
        </div>
        {!blocks.length && (
          <div className="border-b border-line py-8 text-center">
            <p className="font-display text-lg uppercase">Nenhum bloqueio futuro</p>
            <p className="mt-2 text-sm text-muted">
              Adicione folgas, compromissos ou indisponibilidades quando necessário.
            </p>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            disabled={!tenant.canManage || savingHours}
            onClick={saveHours}
            className="min-h-11 rounded-lg bg-brass px-5 font-display text-xs uppercase text-bg"
          >
            {savingHours ? "Salvando..." : "Salvar funcionamento"}
          </button>
        </div>
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
              Exceptions / leaves
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase">Bloqueios e folgas</h2>
          </div>
          <button
            disabled={!tenant.canManage}
            onClick={() => setShowBlockForm((current) => !current)}
            className="flex items-center gap-2 rounded-lg bg-brass px-3 py-2 font-display text-xs uppercase tracking-wider text-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} /> Adicionar
          </button>
        </div>
        {showBlockForm && (
          <form
            onSubmit={addBlock}
            className="mb-4 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2"
          >
            <BlockDateTimeField
              label="Início"
              date={blockForm.startDate}
              time={blockForm.startTime}
              onDateChange={(startDate) => setBlockForm({ ...blockForm, startDate })}
              onTimeChange={(startTime) => setBlockForm({ ...blockForm, startTime })}
            />
            <BlockDateTimeField
              label="Fim"
              date={blockForm.endDate}
              time={blockForm.endTime}
              onDateChange={(endDate) => setBlockForm({ ...blockForm, endDate })}
              onTimeChange={(endTime) => setBlockForm({ ...blockForm, endTime })}
            />
            <label className="sm:col-span-2">
              <span className="mb-1.5 block font-mono text-[10px] uppercase text-muted">
                Aplicar a
              </span>
              <select
                value={blockForm.professionalId}
                onChange={(event) =>
                  setBlockForm({ ...blockForm, professionalId: event.target.value })
                }
                className="min-h-11 w-full border border-line bg-bg px-3 text-sm text-cream outline-none focus:border-brass"
              >
                <option value="">Toda a barbearia</option>
                {professionals
                  .filter((professional) => professional.active)
                  .map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block font-mono text-[10px] uppercase text-muted">
                Motivo
              </span>
              <input
                placeholder="Ex.: folga, manutenção ou compromisso"
                value={blockForm.reason}
                onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
                className="w-full border border-line bg-bg px-3 py-2.5 text-sm text-cream outline-none focus:border-brass focus:ring-1 focus:ring-brass/30"
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <button
                disabled={savingBlock}
                type="submit"
                className="min-h-11 bg-brass px-5 py-2 font-display text-xs uppercase text-bg"
              >
                {savingBlock ? "Salvando..." : "Salvar bloqueio"}
              </button>
            </div>
          </form>
        )}
        <div className="divide-y divide-line border-y border-line">
          {blocks.map((block) => (
            <div key={block.id} className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red/15 text-red">
                <CalendarOff size={17} />
              </div>
              <div className="flex-1">
                <p className="font-display text-base uppercase">
                  {block.reason || "Bloqueio de agenda"}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-2">
                  {formatBlockDate(block.startsAt, tenant.timezone)} ·{" "}
                  {block.professionalId
                    ? (professionals.find(
                        (professional) => professional.id === block.professionalId,
                      )?.name ?? "Profissional")
                    : "Toda a barbearia"}
                </p>
              </div>
              <button
                aria-label={`Remover ${block.reason}`}
                disabled={!tenant.canManage}
                onClick={() => removeBlock(block.id)}
                className="flex h-11 w-11 items-center justify-center text-muted-2 transition hover:text-red"
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-2">
          <Calendar size={14} /> Bloqueios impedem novos agendamentos no intervalo definido.
        </p>
      </section>
    </PanelFrame>
  );
}

function TimeField({
  label,
  value,
  optional = false,
  onChange,
}: {
  label: string;
  value: string;
  optional?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block font-mono text-[9px] uppercase text-muted-2">{label}</span>
      <input
        required={!optional}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 w-full border border-line bg-bg px-2 text-xs text-cream outline-none focus:border-brass"
      />
    </label>
  );
}

function BlockDateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  return (
    <fieldset className="border border-line p-3">
      <legend className="px-1 font-mono text-[10px] uppercase text-muted">{label}</legend>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <BrazilianDateInput
          label={`${label}: data`}
          value={date}
          onChange={(nextDate) => onDateChange(nextDate)}
          className="min-w-0 bg-bg px-2 py-2 text-xs text-cream outline-none focus:ring-1 focus:ring-brass"
        />
        <input
          aria-label={`${label}: horário`}
          required
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          className="bg-bg px-2 py-2 text-xs text-cream outline-none focus:ring-1 focus:ring-brass"
        />
      </div>
    </fieldset>
  );
}

function formatBlockDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
