"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  phone: string;
  updatedAt: string;
  _count: { appointments: number };
  appointments: { startsAt: string }[];
};

export function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load(value = query) {
    try {
      const response = await fetch(
        `/api/customers${value ? `?q=${encodeURIComponent(value)}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCustomers(data.customers);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Não foi possível carregar clientes.",
      );
    }
  }

  useEffect(() => {
    // Customer data is synchronized with the authenticated API on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("");
    // load intentionally runs once for the initial authenticated snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Relacionamento</span>
          <h1>Clientes</h1>
        </div>
        <div className="compact-actions">
          <Link className="small-button" href="/dashboard">
            Painel
          </Link>
          <Link className="small-button" href="/dashboard/agenda">
            Agenda
          </Link>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="card">
        <form
          className="compact-actions"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <input
            aria-label="Buscar cliente"
            placeholder="Nome ou telefone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="small-button" type="submit">
            Buscar
          </button>
        </form>
        {customers.length === 0 ? (
          <p className="muted" style={{ marginTop: 20 }}>
            Nenhum cliente encontrado.
          </p>
        ) : (
          <ul className="list" style={{ marginTop: 20 }}>
            {customers.map((customer) => (
              <li className="list-item" key={customer.id}>
                <div>
                  <strong>{customer.name}</strong>
                  <div className="muted">{customer.phone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{customer._count.appointments}</strong>
                  <div className="muted">
                    visita(s)
                    {customer.appointments[0]
                      ? ` · última ${new Intl.DateTimeFormat("pt-BR").format(new Date(customer.appointments[0].startsAt))}`
                      : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
