"use client";

import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  Download,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  Plus,
  Scissors,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { money } from "@/components/formatters";
import { BrazilianDateInput, formatBrazilianDate } from "@/components/brazilian-date-input";
import { PanelFrame, PanelNav } from "@/components/panel-nav";
import type { PanelTenant } from "@/components/tenant-types";

type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
type DashboardAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  service: { name: string; price: number };
  professional: { name: string };
  customer: { name: string; phone: string };
};
type DashboardData = {
  date: string;
  today: string;
  totalToday: number;
  estimatedRevenue: number;
  appointments: DashboardAppointment[];
  onboarding: {
    service: boolean;
    professional: boolean;
    hours: boolean;
    contact: boolean;
    publicPage: boolean;
  };
};
type Service = { id: string; name: string; active: boolean };
type Professional = {
  id: string;
  name: string;
  active: boolean;
  services: { service: { id: string } }[];
};

export function PanelDashboard({ tenant }: { tenant: PanelTenant }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);

  async function loadDashboard(nextDate?: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard${nextDate ? `?date=${nextDate}` : ""}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar o painel.");
      setData(payload);
      setDate(payload.date);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar o painel.");
        if (!cancelled) {
          setData(payload);
          setDate(payload.date);
        }
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError instanceof Error ? requestError.message : "Erro ao carregar o painel.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const appointments = data?.appointments ?? [];
  const nextAppointment = appointments.find(
    (appointment) =>
      ["SCHEDULED", "CONFIRMED"].includes(appointment.status) &&
      new Date(appointment.endsAt) > new Date(),
  );

  return (
    <PanelFrame>
      <PanelTopbar tenant={tenant} />
      <PanelNav />
      {data && !data.onboarding.publicPage && <Onboarding data={data} />}
      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            {date ? formatBrazilianDate(date) : "Carregando agenda"}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Agenda
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-muted focus-within:border-brass">
            <CalendarDays size={16} />
            <span className="sr-only">Data da agenda</span>
            <BrazilianDateInput
              key={date || "agenda-date"}
              value={date}
              label="Data da agenda"
              onChange={(nextDate) => void loadDashboard(nextDate)}
              className="bg-transparent font-mono text-xs text-cream outline-none"
            />
          </label>
          <button
            disabled={!tenant.canManage}
            onClick={() => setShowManual((current) => !current)}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-brass px-4 font-display text-xs uppercase text-bg"
          >
            {showManual ? <X size={16} /> : <Plus size={16} />}{" "}
            {showManual ? "Fechar" : "Novo horário"}
          </button>
        </div>
      </div>
      {showManual && data && (
        <ManualBooking
          key={date}
          tenant={tenant}
          date={date}
          onCreated={() => {
            setShowManual(false);
            void loadDashboard(date);
          }}
        />
      )}
      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <Summary
          label="Agendamentos"
          value={String(data?.totalToday ?? 0).padStart(2, "0")}
          detail="ativos no dia"
          icon={<CalendarDays size={17} />}
        />
        <Summary
          label="Faturamento previsto"
          value={money(data?.estimatedRevenue ?? 0)}
          detail="exclui cancelados e faltas"
          icon={<WalletCards size={17} />}
          brass
        />
        <Summary
          label="Próximo atendimento"
          value={nextAppointment ? formatTime(nextAppointment.startsAt, tenant.timezone) : "Livre"}
          detail={nextAppointment?.customer.name ?? "nenhum atendimento pendente"}
          icon={<Clock3 size={17} />}
        />
      </section>
      <section className="mt-9">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">
              Operação do dia
            </p>
            <h2 className="mt-1 font-display text-2xl uppercase">Atendimentos</h2>
          </div>
          <span className="font-mono text-xs text-muted">{appointments.length} registros</span>
        </div>
        {error && (
          <p role="alert" className="border border-red/40 bg-red/10 p-4 text-sm text-[#e3a29b]">
            {error}
          </p>
        )}
        {loading && <p className="py-8 text-sm text-muted">Carregando agendamentos...</p>}
        {!loading && !error && !appointments.length && (
          <div className="border border-dashed border-line p-8 text-center">
            <h3 className="font-display text-xl uppercase">Agenda livre nesta data</h3>
            <p className="mt-2 text-sm text-muted">
              Crie um agendamento manual ou compartilhe sua página pública.
            </p>
            <Link
              href="/painel/configuracoes"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-brass"
            >
              <ExternalLink size={15} /> Abrir opções de compartilhamento
            </Link>
          </div>
        )}
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <AppointmentTicket
              key={appointment.id}
              appointment={appointment}
              timeZone={tenant.timezone}
              canManage={tenant.canManage}
              onChanged={() => void loadDashboard(date)}
            />
          ))}
        </div>
      </section>
    </PanelFrame>
  );
}

function Onboarding({ data }: { data: DashboardData }) {
  const steps = [
    { done: data.onboarding.service, label: "Cadastrar serviço", href: "/painel/servicos" },
    {
      done: data.onboarding.professional,
      label: "Adicionar profissional",
      href: "/painel/profissionais",
    },
    { done: data.onboarding.hours, label: "Revisar horários", href: "/painel/horarios" },
    { done: data.onboarding.contact, label: "Informar WhatsApp", href: "/painel/configuracoes" },
  ];
  const completed = steps.filter((step) => step.done).length;
  return (
    <section className="mt-7 border border-brass/35 bg-brass/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass">
            Primeiros passos · {completed}/{steps.length}
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase">Publique sua agenda</h2>
          <p className="mt-2 text-sm text-muted">
            Complete a configuração mínima para receber o primeiro agendamento.
          </p>
        </div>
        <Scissors className="shrink-0 text-brass" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex min-h-11 items-center gap-3 border border-line bg-bg/40 px-3 text-sm text-cream hover:border-brass"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${step.done ? "border-brass bg-brass text-bg" : "border-muted text-transparent"}`}
            >
              <Check size={13} />
            </span>
            {step.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function PanelTopbar({ tenant }: { tenant: PanelTenant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brass text-bg">
          <Scissors size={20} />
        </div>
        <div>
          <p className="font-display text-lg uppercase leading-none">{tenant.name}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            Painel operacional
          </p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Abrir menu da conta"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brass hover:text-brass ${open ? "border-brass text-brass" : ""}`}
      >
        <MoreHorizontal size={19} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-14 z-10 w-56 rounded-xl border border-line bg-surface p-2 shadow-2xl shadow-black/40"
        >
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-bg-card hover:text-cream"
          >
            <ExternalLink size={16} className="text-brass" /> Página pública
          </Link>
          <Link
            href="/painel/configuracoes"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-bg-card hover:text-cream"
          >
            <Settings size={16} className="text-brass" /> Configurações
          </Link>
          <PushNotificationButton />
          <PwaInstallButton />
          <div className="my-2 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-[#e3a29b] hover:bg-red/10"
          >
            <LogOut size={16} /> Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

type PushState = "loading" | "enabled" | "disabled";

function PushNotificationButton() {
  const [state, setState] = useState<PushState>("loading");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? "enabled" : "disabled"))
      .catch(() => setState("disabled"));
  }, []);

  async function toggle() {
    setPending(true);
    setError("");
    try {
      if (state === "enabled") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch("/api/notifications/subscriptions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          if (!response.ok && response.status !== 404) throw new Error("Não foi possível desativar os alertas.");
          await subscription.unsubscribe();
        }
        setState("disabled");
        return;
      }

      const configResponse = await fetch("/api/notifications/config");
      const config = await configResponse.json();
      if (!configResponse.ok || !config.configured) {
        throw new Error("As notificações ainda não estão configuradas neste ambiente.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permita as notificações no navegador para ativá-las.");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const current = await registration.pushManager.getSubscription();
      const subscription =
        current ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(config.publicKey),
        }));
      const response = await fetch("/api/notifications/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível ativar os alertas.");
      setState("enabled");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível ativar os alertas.");
    } finally {
      setPending(false);
    }
  }

  if (state === "loading") return null;
  return (
    <>
      <button
        type="button"
        role="menuitem"
        disabled={pending}
        onClick={() => void toggle()}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-muted hover:bg-bg-card hover:text-cream disabled:cursor-wait disabled:opacity-60"
      >
        <Bell size={16} className={state === "enabled" ? "text-brass" : "text-muted"} />
        {state === "enabled" ? "Desativar alertas" : "Ativar alertas de agenda"}
      </button>
      {error && <p className="px-3 pb-2 text-xs leading-5 text-[#e3a29b]">{error}</p>}
    </>
  );
}

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type InstallState = "checking" | "available" | "ios" | "installed" | "hidden";

function PwaInstallButton() {
  const [state, setState] = useState<InstallState>("checking");
  const [showIosHelp, setShowIosHelp] = useState(false);
  const deferredPrompt = useRef<DeferredInstallPrompt | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as DeferredInstallPrompt;
      setState("available");
    };
    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setState("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    Promise.resolve().then(() => {
      if (!deferredPrompt.current) setState(standalone ? "installed" : ios ? "ios" : "hidden");
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function install() {
    if (state === "ios") {
      setShowIosHelp((current) => !current);
      return;
    }
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const choice = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setState(choice.outcome === "accepted" ? "installed" : "hidden");
  }

  if (state === "checking" || state === "hidden") return null;
  if (state === "installed") {
    return (
      <div className="flex min-h-11 items-center gap-3 px-3 text-sm text-muted">
        <Check size={16} className="text-brass" /> Aplicativo instalado
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={() => void install()}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-muted hover:bg-bg-card hover:text-cream"
      >
        <Download size={16} className="text-brass" />
        {state === "ios" ? "Como instalar no iPhone" : "Instalar aplicativo"}
      </button>
      {showIosHelp && state === "ios" && (
        <p className="px-3 pb-2 text-xs leading-5 text-muted">
          No Safari, toque em Compartilhar e depois em &quot;Adicionar à Tela de Início&quot;.
        </p>
      )}
    </>
  );
}

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
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
      <div className={`flex items-center justify-between ${brass ? "text-brass" : "text-muted"}`}>
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`mt-5 font-mono text-2xl ${brass ? "text-brass" : "text-cream"}`}>{value}</p>
      <p className="mt-1 truncate text-xs text-muted">{detail}</p>
    </article>
  );
}

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "agendado",
  CONFIRMED: "confirmado",
  COMPLETED: "concluído",
  CANCELLED: "cancelado",
  NO_SHOW: "não compareceu",
};

function AppointmentTicket({
  appointment,
  timeZone,
  canManage,
  onChanged,
}: {
  appointment: DashboardAppointment;
  timeZone: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function changeStatus(status: AppointmentStatus) {
    setPending(true);
    setError("");
    const response = await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    if (!response.ok) setError(payload.error ?? "Não foi possível alterar o status.");
    else onChanged();
    setPending(false);
  }
  const actions =
    appointment.status === "SCHEDULED"
      ? [
          { status: "CONFIRMED" as const, label: "Confirmar" },
          { status: "CANCELLED" as const, label: "Cancelar" },
        ]
      : appointment.status === "CONFIRMED"
        ? [
            { status: "COMPLETED" as const, label: "Concluir" },
            { status: "NO_SHOW" as const, label: "Não veio" },
            { status: "CANCELLED" as const, label: "Cancelar" },
          ]
        : [];
  return (
    <article className="ticket border border-dashed border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[70px_1fr_auto] sm:items-center">
        <div className="border-b border-line pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
          <p className="font-mono text-lg text-brass">
            {formatTime(appointment.startsAt, timeZone)}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase text-muted">
            {Math.round(
              (new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) /
                60000,
            )}{" "}
            min
          </p>
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg uppercase">{appointment.customer.name}</p>
          <p className="mt-1 text-xs text-muted">
            {appointment.service.name} · {appointment.professional.name}
          </p>
          <a
            href={`https://wa.me/${appointment.customer.phone}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-brass"
          >
            Falar com cliente
          </a>
        </div>
        <div className="sm:text-right">
          <span className="inline-flex rounded-full bg-line px-2.5 py-1 font-mono text-[9px] uppercase text-muted">
            {statusLabels[appointment.status]}
          </span>
        </div>
      </div>
      {canManage && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
          {actions.map((action) => (
            <button
              key={action.status}
              disabled={pending}
              onClick={() => void changeStatus(action.status)}
              className={`min-h-10 border px-3 font-display text-xs uppercase ${action.status === "CANCELLED" ? "border-red/40 text-[#e3a29b]" : "border-line text-muted hover:border-brass hover:text-brass"}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#e3a29b]">
          {error}
        </p>
      )}
    </article>
  );
}

function ManualBooking({
  tenant,
  date,
  onCreated,
}: {
  tenant: PanelTenant;
  date: string;
  onCreated: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    serviceId: "",
    professionalId: "",
    time: "",
    customerName: "",
    customerPhone: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([fetch("/api/services"), fetch("/api/professionals")]).then(
      async ([servicesResponse, professionalsResponse]) => {
        const servicesPayload = await servicesResponse.json();
        const professionalsPayload = await professionalsResponse.json();
        setServices(servicesPayload.services.filter((service: Service) => service.active));
        setProfessionals(
          professionalsPayload.professionals.filter(
            (professional: Professional) => professional.active,
          ),
        );
      },
    );
  }, []);

  useEffect(() => {
    if (!form.serviceId || !form.professionalId || !date) return;
    let cancelled = false;
    fetch(
      `/api/public/barbershops/${tenant.slug}/availability?date=${date}&serviceId=${form.serviceId}&professionalId=${form.professionalId}`,
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        if (!cancelled) setSlots(payload.slots);
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError instanceof Error ? requestError.message : "Erro ao carregar horários.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, form.professionalId, form.serviceId, tenant.slug]);

  const compatibleProfessionals = professionals.filter((professional) =>
    professional.services.some((item) => item.service.id === form.serviceId),
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date, notes: form.notes || null }),
    });
    const payload = await response.json();
    if (!response.ok) setError(payload.error ?? "Não foi possível criar o agendamento.");
    else onCreated();
    setSubmitting(false);
  }
  return (
    <form onSubmit={submit} className="mt-5 border border-brass/35 bg-surface p-5">
      <h2 className="font-display text-xl uppercase">
        Novo agendamento em {formatBrazilianDate(date)}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField label="Serviço">
          <select
            required
            value={form.serviceId}
            onChange={(event) => {
              setSlots([]);
              setForm({ ...form, serviceId: event.target.value, professionalId: "", time: "" });
            }}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Profissional">
          <select
            required
            value={form.professionalId}
            onChange={(event) => {
              setSlots([]);
              setLoadingSlots(Boolean(event.target.value));
              setForm({ ...form, professionalId: event.target.value, time: "" });
            }}
            className={fieldClass}
          >
            <option value="">Selecione</option>
            {compatibleProfessionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Cliente">
          <input
            required
            minLength={2}
            autoComplete="name"
            value={form.customerName}
            onChange={(event) => setForm({ ...form, customerName: event.target.value })}
            className={fieldClass}
          />
        </FormField>
        <FormField label="Telefone">
          <input
            required
            type="tel"
            autoComplete="tel"
            value={form.customerPhone}
            onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
            className={fieldClass}
          />
        </FormField>
      </div>
      <fieldset className="mt-4">
        <legend className="font-mono text-[10px] uppercase text-muted">Horário</legend>
        {loadingSlots ? (
          <p className="mt-2 text-sm text-muted">Buscando horários...</p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {slots.map((slot) => {
              const time = formatTime(slot, tenant.timezone);
              return (
                <button
                  type="button"
                  aria-pressed={form.time === time}
                  key={slot}
                  onClick={() => setForm({ ...form, time })}
                  className={`min-h-11 border font-mono text-xs ${form.time === time ? "border-brass bg-brass text-bg" : "border-line text-muted"}`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
      {form.professionalId && !loadingSlots && !slots.length && (
        <p className="mt-3 text-sm text-muted">Nenhum horário válido disponível nesta data.</p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#e3a29b]">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <button
          disabled={submitting || !form.time}
          className="min-h-11 bg-brass px-5 font-display text-xs uppercase text-bg"
        >
          {submitting ? "Criando..." : "Criar agendamento"}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block font-mono text-[10px] uppercase text-muted">{label}</span>
      {children}
    </label>
  );
}
const fieldClass =
  "min-h-11 w-full border border-line bg-bg px-3 text-sm text-cream outline-none focus:border-brass";
function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone }).format(
    new Date(value),
  );
}
