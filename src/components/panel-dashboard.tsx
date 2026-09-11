"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MoreHorizontal,
  Scissors,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PanelFrame, PanelNav } from "@/components/panel-nav";
import { money } from "@/components/formatters";
import type { PanelTenant } from "@/components/tenant-types";

type DashboardAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  service: { name: string; price: number };
  professional: { name: string };
  customer: { name: string };
};

type DashboardData = {
  date: string;
  totalToday: number;
  estimatedRevenue: number;
  appointments: DashboardAppointment[];
};

export function PanelDashboard({ tenant }: { tenant: PanelTenant }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar o painel.");
        setData(payload);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error ? requestError.message : "Erro ao carregar o painel.",
        );
      });
  }, []);

  const appointments = data?.appointments ?? [];
  const confirmed = appointments.filter((appointment) => appointment.status === "CONFIRMED").length;

  return (
    <PanelFrame>
      <PanelTopbar tenant={tenant} />
      <PanelNav />
      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            {data?.date ?? "Carregando agenda"}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Agenda de hoje
          </h1>
        </div>
        <button className="flex items-center gap-2 self-start rounded-lg border border-line px-3 py-2 font-display text-xs uppercase tracking-wider text-muted hover:border-brass hover:text-brass sm:self-auto">
          <CalendarDays size={15} /> Hoje
        </button>
      </div>
      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <Summary
          label="Agendamentos"
          value={String(data?.totalToday ?? 0).padStart(2, "0")}
          detail={`${confirmed} confirmados`}
          icon={<CalendarDays size={17} />}
        />
        <Summary
          label="Faturamento previsto"
          value={money(data?.estimatedRevenue ?? 0)}
          detail="sem pagamentos online"
          icon={<WalletCards size={17} />}
          brass
        />
        <Summary
          label="Vagas livres"
          value="07"
          detail="de 12 horários"
          icon={<Clock3 size={17} />}
        />
      </section>
      <section className="mt-9">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-2">
              Hoje / appointments
            </p>
            <h2 className="mt-1 font-display text-2xl uppercase">Próximos horários</h2>
          </div>
          <span className="font-mono text-xs text-muted-2">{appointments.length} registros</span>
        </div>
        <div className="space-y-3">
          {error && (
            <p className="border border-red/40 bg-red/10 px-4 py-3 text-sm text-[#e3a29b]">
              {error}
            </p>
          )}
          {!data && !error && <p className="py-8 text-sm text-muted">Carregando agendamentos...</p>}
          {appointments.map((appointment) => (
            <AppointmentTicket
              key={appointment.id}
              appointment={appointment}
              timeZone={tenant.timezone}
              canManage={tenant.canManage}
              onToggle={async () => {
                const status = appointment.status === "CONFIRMED" ? "SCHEDULED" : "CONFIRMED";
                const response = await fetch(`/api/appointments/${appointment.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status }),
                });
                if (response.ok) {
                  setData((current) =>
                    current
                      ? {
                          ...current,
                          appointments: current.appointments.map((item) =>
                            item.id === appointment.id ? { ...item, status } : item,
                          ),
                        }
                      : current,
                  );
                }
              }}
            />
          ))}
        </div>
      </section>
    </PanelFrame>
  );
}

function PanelTopbar({ tenant }: { tenant: PanelTenant }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass text-bg">
          <Scissors size={19} />
        </div>
        <div>
          <p className="font-display text-lg uppercase leading-none">{tenant.name}</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-2">
            Barber OS / {tenant.slug}
          </p>
        </div>
      </div>
      <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-cream">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}

function Summary({
  label,
  value,
  detail,
  icon,
  brass = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  brass?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${brass ? "border-brass/40 bg-brass/10" : "border-line bg-surface"}`}
    >
      <div className={`flex items-center justify-between ${brass ? "text-brass" : "text-muted-2"}`}>
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`mt-5 font-mono text-2xl ${brass ? "text-brass" : "text-cream"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-muted-2">{detail}</p>
    </article>
  );
}

function AppointmentTicket({
  appointment,
  timeZone,
  canManage,
  onToggle,
}: {
  appointment: DashboardAppointment;
  timeZone: string;
  canManage: boolean;
  onToggle: () => Promise<void>;
}) {
  const confirmed = appointment.status === "CONFIRMED";
  return (
    <article className="ticket border border-dashed border-line bg-surface px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="min-w-[52px] border-r border-line pr-4">
          <p className="font-mono text-lg text-brass">
            {formatTime(appointment.startsAt, timeZone)}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase text-muted-2">
            {Math.round(
              (new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) /
                60000,
            )}{" "}
            min
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg uppercase">{appointment.customer.name}</p>
          <p className="mt-1 text-xs text-muted">
            {appointment.service.name} · {appointment.professional.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${confirmed ? "bg-teal/30 text-[#9fc1ca]" : "bg-red/25 text-[#e3a29b]"}`}
          >
            {confirmed ? "confirmado" : "aguardando"}
          </span>
          <button
            disabled={!canManage}
            onClick={onToggle}
            className="flex items-center gap-1 font-mono text-[9px] uppercase text-muted-2 hover:text-brass disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmed ? <Check size={11} /> : <ArrowUpRight size={11} />}{" "}
            {confirmed ? "ok" : "confirmar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone }).format(
    new Date(value),
  );
}
