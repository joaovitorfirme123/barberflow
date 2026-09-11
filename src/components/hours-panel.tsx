"use client";

import { Calendar, CalendarOff, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { PanelFrame, PanelNav } from "@/components/panel-nav";
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
};

export function HoursPanel({ tenant }: { tenant: PanelTenant }) {
  const [schedule, setSchedule] = useState<BusinessHour[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({ startsAt: "", endsAt: "", reason: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/business-hours"), fetch("/api/schedule-blocks")])
      .then(async ([hoursResponse, blocksResponse]) => {
        const hoursPayload = await hoursResponse.json();
        const blocksPayload = await blocksResponse.json();
        if (!hoursResponse.ok)
          throw new Error(hoursPayload.error ?? "Não foi possível carregar os horários.");
        if (!blocksResponse.ok)
          throw new Error(blocksPayload.error ?? "Não foi possível carregar os bloqueios.");
        setSchedule(hoursPayload.hours);
        setBlocks(blocksPayload.blocks);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error ? requestError.message : "Erro ao carregar horários.",
        );
      });
  }, []);

  async function toggleDay(day: BusinessHour) {
    if (!tenant.canManage) return;
    const next = schedule.map((item) =>
      item.weekday === day.weekday ? { ...item, closed: !item.closed } : item,
    );
    const response = await fetch("/api/business-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: next }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível salvar os horários.");
      return;
    }
    setSchedule(payload.hours);
  }

  async function addBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/schedule-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...blockForm, reason: blockForm.reason || null }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível criar o bloqueio.");
      return;
    }
    setBlocks((current) =>
      [...current, payload.block].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
    setBlockForm({ startsAt: "", endsAt: "", reason: "" });
    setShowBlockForm(false);
  }

  async function removeBlock(id: string) {
    const response = await fetch(`/api/schedule-blocks/${id}`, { method: "DELETE" });
    if (response.ok) setBlocks((current) => current.filter((block) => block.id !== id));
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
        <p className="mt-5 border border-red/40 bg-red/10 px-4 py-3 text-sm text-[#e3a29b]">
          {error}
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
            <div key={item.weekday} className="flex items-center gap-3 py-4">
              <span
                className={`w-10 font-mono text-[10px] ${!item.closed ? "text-brass" : "text-muted-2"}`}
              >
                {shortDays[item.weekday]}
              </span>
              <span className="flex-1 font-display text-lg uppercase">
                {weekDays[item.weekday]}
              </span>
              <span className={`font-mono text-xs ${!item.closed ? "text-muted" : "text-muted-2"}`}>
                {item.closed ? "Fechado" : `${item.openTime} — ${item.closeTime}`}
              </span>
              <button
                aria-label={`Alternar ${weekDays[item.weekday]}`}
                disabled={!tenant.canManage}
                onClick={() => toggleDay(item)}
                className={`relative h-6 w-11 rounded-full p-1 transition ${!item.closed ? "bg-brass" : "bg-surface ring-1 ring-line"}`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-cream transition-transform ${!item.closed ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
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
            className="mb-4 grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <input
              required
              type="datetime-local"
              value={blockForm.startsAt}
              onChange={(event) => setBlockForm({ ...blockForm, startsAt: event.target.value })}
              className="border border-line bg-bg px-3 py-2 text-xs text-cream outline-none"
            />
            <input
              required
              type="datetime-local"
              value={blockForm.endsAt}
              onChange={(event) => setBlockForm({ ...blockForm, endsAt: event.target.value })}
              className="border border-line bg-bg px-3 py-2 text-xs text-cream outline-none"
            />
            <input
              placeholder="Motivo"
              value={blockForm.reason}
              onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
              className="border border-line bg-bg px-3 py-2 text-xs text-cream outline-none placeholder:text-muted-2"
            />
            <button
              type="submit"
              className="bg-brass px-3 py-2 font-display text-xs uppercase text-bg"
            >
              Salvar
            </button>
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
                  {formatBlockDate(block.startsAt, tenant.timezone)}
                </p>
              </div>
              <button
                aria-label={`Remover ${block.reason}`}
                disabled={!tenant.canManage}
                onClick={() => removeBlock(block.id)}
                className="text-muted-2 transition hover:text-red"
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

function formatBlockDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
