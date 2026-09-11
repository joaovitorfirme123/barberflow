"use client";

import { ArrowLeft, CalendarDays, Check, Clock3, Phone, Scissors, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { money } from "@/components/formatters";
import type { PublicBarbershop } from "@/components/tenant-types";

export function BookingFlow({ shop }: { shop: PublicBarbershop }) {
  const [serviceId, setServiceId] = useState(shop.services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState(
    shop.professionals.find((professional) =>
      professional.serviceIds.includes(shop.services[0]?.id ?? ""),
    )?.id ??
      shop.professionals[0]?.id ??
      "",
  );
  const [date, setDate] = useState(todayInTimeZone(shop.timezone));
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState<{
    date: string;
    time: string;
    whatsappUrl?: string;
  } | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const service = shop.services.find((item) => item.id === serviceId);
  const professionals = shop.professionals.filter((professional) =>
    professional.serviceIds.includes(serviceId),
  );

  useEffect(() => {
    if (!serviceId || !professionalId || !date) {
      return;
    }

    let cancelled = false;
    fetch(
      `/api/public/barbershops/${shop.slug}/availability?date=${date}&serviceId=${serviceId}&professionalId=${professionalId}`,
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os horários.");
        if (!cancelled) setSlots(data.slots);
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError instanceof Error ? requestError.message : "Erro ao carregar horários.",
          );
      });

    return () => {
      cancelled = true;
    };
  }, [date, professionalId, serviceId, shop.slug]);

  function changeService(nextServiceId: string) {
    setServiceId(nextServiceId);
    const firstProfessional = shop.professionals.find((professional) =>
      professional.serviceIds.includes(nextServiceId),
    );
    setProfessionalId(firstProfessional?.id ?? "");
  }

  async function submitBooking() {
    if (!service || !slot || !professionalId || !name || !phone) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/public/barbershops/${shop.slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          professionalId,
          date,
          time: timeInTimeZone(slot, shop.timezone),
          customerName: name,
          customerPhone: phone,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível confirmar o agendamento.");
      setConfirmed({
        date,
        time: timeInTimeZone(slot, shop.timezone),
        whatsappUrl: data.whatsappUrl,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível confirmar o agendamento.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return <BookingSuccess shop={shop} service={service?.name ?? "Serviço"} booking={confirmed} />;
  }

  return (
    <main className="min-h-screen bg-bg px-3 py-3 text-cream sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-line bg-bg-card p-5 shadow-2xl shadow-black/30 sm:p-9">
        <Link
          href={`/${shop.slug}`}
          className="mb-8 flex w-fit items-center gap-2 text-xs uppercase tracking-wider text-muted transition hover:text-brass"
        >
          <ArrowLeft size={16} /> {shop.name}
        </Link>
        <div className="mb-9">
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">Book / 001</p>
          <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Novo agendamento</h1>
          <p className="mt-2 text-sm text-muted">Reserve seu horário em poucos passos.</p>
        </div>

        <div className="space-y-9">
          <section>
            <StepLabel number="01" label="Escolha o serviço" />
            <div className="grid gap-2 sm:grid-cols-2">
              {shop.services.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    changeService(item.id);
                    setSlot("");
                  }}
                  className={`flex items-center justify-between border p-4 text-left transition ${serviceId === item.id ? "border-brass bg-brass/10" : "border-line bg-surface hover:border-muted-2"}`}
                >
                  <span>
                    <span className="block font-display text-lg uppercase">{item.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-muted-2">
                      <Clock3 size={12} /> {item.duration} min
                    </span>
                  </span>
                  <span className="font-mono text-sm text-brass">{money(item.price)}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <StepLabel number="02" label="Escolha o profissional" />
            <div className="grid gap-2 sm:grid-cols-3">
              {professionals.map((professional) => (
                <button
                  key={professional.id}
                  onClick={() => {
                    setProfessionalId(professional.id);
                    setSlot("");
                  }}
                  className={`border px-3 py-3 text-left font-display text-sm uppercase transition ${professionalId === professional.id ? "border-brass bg-brass text-bg" : "border-line bg-surface text-muted hover:border-brass hover:text-brass"}`}
                >
                  {professional.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <StepLabel number="03" label="Escolha o horário" />
            <label className="mb-3 flex items-center gap-3 border border-line bg-surface px-3">
              <CalendarDays size={17} className="text-muted-2" />
              <input
                type="date"
                value={date}
                min={todayInTimeZone(shop.timezone)}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSlot("");
                }}
                className="w-full bg-transparent py-3 text-sm text-cream outline-none"
              />
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {slots.map((item) => (
                <button
                  key={item}
                  onClick={() => setSlot(item)}
                  className={`rounded-lg border px-2 py-3 font-mono text-xs transition ${slot === item ? "border-brass bg-brass text-bg" : "border-line bg-surface text-muted hover:border-brass hover:text-brass"}`}
                >
                  {timeInTimeZone(item, shop.timezone)}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-muted-2">
              <Clock3 size={13} /> {slots.length ? formatDate(date) : "Sem horários disponíveis"}
            </p>
          </section>
          <section>
            <StepLabel number="04" label="Seus dados" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 border border-line bg-surface px-3">
                <UserRound size={17} className="text-muted-2" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-transparent py-3 text-sm text-cream outline-none placeholder:text-muted-2"
                />
              </label>
              <label className="flex items-center gap-3 border border-line bg-surface px-3">
                <Phone size={17} className="text-muted-2" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="WhatsApp"
                  className="w-full bg-transparent py-3 text-sm text-cream outline-none placeholder:text-muted-2"
                />
              </label>
            </div>
          </section>
        </div>

        {error && (
          <p className="mt-5 border border-red/40 bg-red/10 px-4 py-3 text-sm text-[#e3a29b]">
            {error}
          </p>
        )}
        <div className="mt-10 border-t border-line pt-6">
          <button
            disabled={!slot || !name || !phone || submitting}
            onClick={submitBooking}
            className="flex w-full items-center justify-between rounded-xl bg-red px-5 py-4 font-display text-sm uppercase tracking-wider text-cream transition hover:bg-red/80 disabled:bg-surface disabled:text-muted-2"
          >
            <span>{submitting ? "Confirmando..." : "Confirmar agendamento"}</span>
            <span className="font-mono text-xs normal-case text-cream/80">
              {slot && service
                ? `${money(service.price)} · ${timeInTimeZone(slot, shop.timezone)}`
                : "selecione um horário"}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

function StepLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-[10px] text-brass">{number}</span>
      <h2 className="font-display text-lg uppercase tracking-wide">{label}</h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function BookingSuccess({
  shop,
  service,
  booking,
}: {
  shop: PublicBarbershop;
  service: string;
  booking: { date: string; time: string; whatsappUrl?: string };
}) {
  return (
    <main className="min-h-screen bg-bg px-3 py-3 text-cream sm:px-6 sm:py-8">
      <div className="mx-auto max-w-xl rounded-[28px] border border-line bg-bg-card p-5 shadow-2xl shadow-black/30 sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brass text-bg">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[.25em] text-brass">
            Booking confirmed / 200
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase">Tá marcado.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
            Seu lembrete chega pelo WhatsApp. A cadeira está te esperando.
          </p>
        </div>
        <div className="ticket mt-9 border border-dashed border-line bg-surface p-5">
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-2">Barbearia</p>
              <p className="mt-1 font-display text-xl uppercase">{shop.name}</p>
            </div>
            <Scissors className="text-brass" size={22} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-2">Serviço</p>
              <p className="mt-1 text-sm text-cream">{service}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-2">Horário</p>
              <p className="mt-1 font-mono text-sm text-brass">
                {booking.time} · {formatDate(booking.date)}
              </p>
            </div>
          </div>
          <div className="ticket-edge mt-5 pt-4 font-mono text-[10px] uppercase tracking-widest text-muted-2">
            senha #A-042 · chegue 5 min antes
          </div>
        </div>
        <Link
          href={`/${shop.slug}`}
          className="mt-6 flex w-full items-center justify-center rounded-xl border border-line px-4 py-3 font-display text-sm uppercase tracking-wider text-muted transition hover:border-brass hover:text-brass"
        >
          Voltar ao perfil
        </Link>
        {booking.whatsappUrl && (
          <a
            href={booking.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-brass px-4 py-3 font-display text-sm uppercase tracking-wider text-bg transition hover:bg-brass/80"
          >
            Abrir confirmação no WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}

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

function timeInTimeZone(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
