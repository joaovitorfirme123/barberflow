"use client";

import { useState } from "react";

export function BrazilianDateInput({
  value,
  onChange,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(() => formatDisplay(value));

  function handleChange(nextValue: string) {
    const digits = nextValue.replace(/\D/g, "").slice(0, 8);
    const formatted = formatDraft(digits);
    setDraft(formatted);
    if (digits.length === 8) {
      const iso = parseDisplay(formatted);
      if (iso) onChange(iso);
    }
    if (!digits.length) onChange("");
  }

  return (
    <input
      aria-label={label}
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      value={draft}
      onChange={(event) => handleChange(event.target.value)}
      className={className}
    />
  );
}

export function formatBrazilianDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : value;
}

function formatDisplay(value: string) {
  return value ? formatBrazilianDate(value) : "";
}

function formatDraft(digits: string) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDisplay(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}
