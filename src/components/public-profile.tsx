import { CalendarDays, Clock3, Instagram, MapPin, Phone, Scissors } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { money } from "@/components/formatters";
import type { PublicBarbershop } from "@/components/tenant-types";

export function PublicProfile({ shop }: { shop: PublicBarbershop }) {
  return (
    <main className="min-h-screen bg-bg px-3 py-3 text-cream sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-line bg-bg-card shadow-2xl shadow-black/30">
        <header className="relative min-h-[285px] overflow-visible bg-[linear-gradient(135deg,#29231c_0%,#1b1815_62%,#141210_100%)] px-5 pb-8 pt-6 sm:px-10 sm:pt-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(201,154,84,.17),transparent_28%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.28em] text-muted-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Barbershop / profile
            </div>
            {!!shop.services.length && (
              <Link
                href={`/${shop.slug}/agendar`}
                className="flex min-h-11 items-center gap-2 rounded-full bg-brass px-4 font-display text-xs uppercase tracking-wider text-bg"
              >
                <CalendarDays size={16} /> Agendar
              </Link>
            )}
          </div>
          <div className="relative mt-20 sm:mt-16">
            <div className="absolute -top-20 left-0 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-[6px] border-bg-card bg-brass text-bg shadow-xl shadow-black/30 sm:h-24 sm:w-24">
              {shop.logoUrl ? (
                <Image
                  unoptimized
                  src={shop.logoUrl}
                  alt={`Logo da ${shop.name}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <Scissors size={40} strokeWidth={1.6} />
              )}
            </div>
            <div className="pt-4 sm:pt-7">
              <h1 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-cream sm:text-6xl">
                {shop.name}
              </h1>
              <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted">
                Agendamento online · {shop.slug}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-10">
          <div className="flex flex-wrap gap-x-7 gap-y-3 border-b border-line pb-6 text-sm text-muted">
            {shop.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-brass"
              >
                <MapPin size={16} className="text-brass" /> {shop.address}
              </a>
            )}
            {shop.instagram && (
              <a
                href={`https://instagram.com/${shop.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-brass"
              >
                <Instagram size={16} className="text-brass" /> {shop.instagram}
              </a>
            )}
            {shop.phone && (
              <a
                href={`https://wa.me/${shop.phone}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-brass"
              >
                <Phone size={16} className="text-brass" /> Falar com a barbearia
              </a>
            )}
          </div>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.25em] text-brass">
                  01 / menu
                </p>
                <h2 className="mt-1 font-display text-3xl uppercase">Serviços</h2>
              </div>
              <span className="font-mono text-xs text-muted-2">{shop.services.length} opções</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {shop.services.map((service, index) => (
                <article
                  key={service.id}
                  className="group border border-line bg-surface p-4 transition hover:border-brass/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] text-muted-2">0{index + 1}</span>
                      <h3 className="mt-2 font-display text-xl uppercase tracking-wide text-cream">
                        {service.name}
                      </h3>
                      <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                        {service.description}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-brass">{money(service.price)}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                    <Clock3 size={13} /> {service.duration} min
                  </div>
                </article>
              ))}
            </div>
            {!shop.services.length && (
              <div className="border border-dashed border-line p-7 text-center">
                <h3 className="font-display text-xl uppercase">Agenda ainda indisponível</h3>
                <p className="mt-2 text-sm text-muted">
                  Esta barbearia ainda não publicou serviços com profissionais disponíveis.
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xs text-xs leading-5 text-muted">
              Escolha seu serviço, encontre um horário e deixe o resto com a gente.
            </p>
            {!!shop.services.length && (
              <Link
                href={`/${shop.slug}/agendar`}
                className="flex items-center justify-center gap-2 rounded-xl bg-red px-6 py-3.5 font-display text-sm uppercase tracking-wider text-cream transition hover:bg-red/80"
              >
                <CalendarDays size={18} /> Agendar horário
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
