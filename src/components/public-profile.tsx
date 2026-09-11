"use client";

import { CalendarDays, Clock3, Heart, Instagram, MapPin, Scissors, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { money } from "@/components/formatters";
import type { PublicBarbershop } from "@/components/tenant-types";

export function PublicProfile({ shop }: { shop: PublicBarbershop }) {
  const [following, setFollowing] = useState(false);

  return (
    <main className="min-h-screen bg-bg px-3 py-3 text-cream sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-line bg-bg-card shadow-2xl shadow-black/30">
        <header className="relative min-h-[285px] overflow-visible bg-[linear-gradient(135deg,#29231c_0%,#1b1815_62%,#141210_100%)] px-5 pb-8 pt-6 sm:px-10 sm:pt-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(201,154,84,.17),transparent_28%)]" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.28em] text-muted-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Barbershop / profile
            </div>
            <button
              onClick={() => setFollowing(!following)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 font-display text-xs uppercase tracking-wider transition ${following ? "border-brass bg-transparent text-brass" : "border-brass bg-brass text-bg"}`}
            >
              <Heart size={15} fill={following ? "none" : "currentColor"} />
              {following ? "Seguindo" : "Seguir"}
            </button>
          </div>
          <div className="relative mt-20 sm:mt-16">
            <div className="absolute -top-20 left-0 flex h-20 w-20 items-center justify-center rounded-2xl border-[6px] border-bg-card bg-brass text-bg shadow-xl shadow-black/30 sm:h-24 sm:w-24">
              <Scissors size={40} strokeWidth={1.6} />
            </div>
            <div className="pt-4 sm:pt-7">
              <h1 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-cream sm:text-6xl">
                {shop.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-wide text-muted">
                <span className="flex items-center gap-1.5 text-brass">
                  <Star size={13} fill="currentColor" /> Perfil verificado
                </span>
                <span className="text-line">/</span>
                <span>{shop.slug}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-10">
          <div className="flex flex-wrap gap-x-7 gap-y-3 border-b border-line pb-6 text-sm text-muted">
            {shop.address && (
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-brass" /> {shop.address}
              </span>
            )}
            {shop.instagram && (
              <span className="flex items-center gap-2">
                <Instagram size={16} className="text-brass" /> {shop.instagram}
              </span>
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
          </section>

          <div className="flex flex-col gap-3 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xs text-xs leading-5 text-muted">
              Escolha seu serviço, encontre um horário e deixe o resto com a gente.
            </p>
            <Link
              href={`/${shop.slug}/agendar`}
              className="flex items-center justify-center gap-2 rounded-xl bg-red px-6 py-3.5 font-display text-sm uppercase tracking-wider text-cream transition hover:bg-red/80"
            >
              <CalendarDays size={18} /> Agendar horário
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
