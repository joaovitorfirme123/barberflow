"use client";

import { ChevronDown, Clock3, Phone, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { initials, money } from "@/components/formatters";
import { PanelFrame, PanelNav } from "@/components/panel-nav";
import type { PanelTenant } from "@/components/tenant-types";

type ApiCustomer = {
  id: string;
  name: string;
  phone: string;
  _count: { appointments: number };
  appointments: { startsAt: string; service: { name: string; price: number | string } }[];
};

export function ClientsPanel({ tenant }: { tenant: PanelTenant }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/customers")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error ?? "Não foi possível carregar os clientes.");
        setCustomers(payload.customers);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error ? requestError.message : "Erro ao carregar clientes.",
        );
      });
  }, []);

  const clients = useMemo(
    () =>
      customers.filter(
        (client) =>
          client.name.toLowerCase().includes(query.toLowerCase()) || client.phone.includes(query),
      ),
    [customers, query],
  );
  return (
    <PanelFrame>
      <PanelHeader tenant={tenant} title="Clientes" eyebrow="CRM / 002" />
      <PanelNav />
      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            Database / {String(clients.length).padStart(2, "0")}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase">Histórico</h1>
        </div>
        <span className="font-mono text-xs text-muted-2">{customers.length} clientes</span>
      </div>
      <label className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface px-4">
        <Search size={17} className="text-muted-2" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="w-full bg-transparent py-3.5 text-sm text-cream outline-none placeholder:text-muted-2"
        />
      </label>
      {error && (
        <p className="mt-4 border border-red/40 bg-red/10 px-4 py-3 text-sm text-[#e3a29b]">
          {error}
        </p>
      )}
      <div className="mt-5 divide-y divide-line border-y border-line">
        {clients.map((client) => (
          <article key={client.id}>
            <button
              onClick={() => setExpanded(expanded === client.id ? null : client.id)}
              className="flex w-full items-center gap-3 py-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brass/40 bg-brass/10 font-display text-sm text-brass">
                {initials(client.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg uppercase">{client.name}</span>
                  {client._count.appointments >= 5 || client._count.appointments <= 1 ? (
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase ${client._count.appointments >= 5 ? "bg-brass/15 text-brass" : "bg-teal/30 text-[#9fc1ca]"}`}
                    >
                      {client._count.appointments >= 5 ? "cliente fiel" : "novo"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-2">
                  {client._count.appointments} visitas <span className="px-1 text-line">/</span>{" "}
                  última:{" "}
                  {client.appointments[0]
                    ? formatDate(client.appointments[0].startsAt, tenant.timezone)
                    : "ainda não"}
                </p>
              </div>
              <ChevronDown
                size={17}
                className={`text-muted-2 transition-transform ${expanded === client.id ? "rotate-180 text-brass" : ""}`}
              />
            </button>
            {expanded === client.id && (
              <div className="mb-4 ml-[52px] border-l border-brass/40 pl-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 py-2 text-xs text-muted">
                  <span className="flex items-center gap-2">
                    <Phone size={13} className="text-brass" /> {client.phone}
                  </span>
                  <span className="flex items-center gap-2">
                    <UserRound size={13} className="text-brass" />{" "}
                    {client._count.appointments ? "cliente recorrente" : "primeira visita"}
                  </span>
                </div>
                {client.appointments.length ? (
                  <div className="mt-3 space-y-2">
                    {client.appointments.map((appointment) => (
                      <div
                        key={`${client.id}-${appointment.startsAt}`}
                        className="flex items-center justify-between border-t border-line pt-2 text-xs"
                      >
                        <span className="flex items-center gap-2 text-muted">
                          <Clock3 size={12} /> {formatDate(appointment.startsAt, tenant.timezone)} ·{" "}
                          {appointment.service.name}
                        </span>
                        <span className="font-mono text-brass">
                          {money(Number(appointment.service.price))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs italic text-muted-2">sem atendimentos anteriores</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </PanelFrame>
  );
}

function PanelHeader({
  tenant,
  title,
  eyebrow,
}: {
  tenant: PanelTenant;
  title: string;
  eyebrow: string;
}) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-brass">
          <span className="h-2 w-2 rounded-full bg-brass" /> {tenant.name}
        </div>
        <h1 className="mt-3 font-display text-3xl uppercase">{title}</h1>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[.25em] text-muted-2">
          {eyebrow}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface font-display text-sm text-brass">
        MN
      </div>
    </header>
  );
}

function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone }).format(new Date(value));
}
