"use client";

import { CalendarDays, ChevronRight, Clock3, Scissors, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/painel", label: "Agenda", icon: CalendarDays },
  { href: "/painel/clientes", label: "Clientes", icon: UsersRound },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/horarios", label: "Horários", icon: Clock3 },
];

export function PanelNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1 scrollbar-hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-2.5 font-display text-sm uppercase tracking-wide transition ${active ? "bg-brass text-bg" : "text-muted hover:bg-bg-card hover:text-cream"}`}
          >
            <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
            {label}
            {active && <ChevronRight size={14} />}
          </Link>
        );
      })}
    </nav>
  );
}

export function PanelFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg px-3 py-3 text-cream sm:px-6 sm:py-6">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-6xl rounded-[28px] border border-line bg-bg-card p-4 shadow-2xl shadow-black/20 sm:p-7">
        {children}
      </div>
    </main>
  );
}
