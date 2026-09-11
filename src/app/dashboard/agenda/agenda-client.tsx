"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  service: { name: string; price: number };
  professional: { id: string; name: string };
  customer: { name: string; phone: string };
};
type Service = { id: string; name: string; active: boolean };
type Professional = {
  id: string;
  name: string;
  active: boolean;
  services: { serviceId: string }[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a operação.");
  return data;
}

export function AgendaClient() {
  const [date, setDate] = useState(today);
  const [filterProfessionalId, setFilterProfessionalId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [week, setWeek] = useState<Record<string, Appointment[]>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [form, setForm] = useState({
    serviceId: "",
    professionalId: "",
    time: "09:00",
    customerName: "",
    customerPhone: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDay(value: string) {
    const data = await requestJson(
      `/api/appointments?date=${value}${filterProfessionalId ? `&professionalId=${filterProfessionalId}` : ""}`,
    );
    setAppointments(data.appointments);
  }

  async function load() {
    try {
      const [serviceData, professionalData] = await Promise.all([
        requestJson("/api/services"),
        requestJson("/api/professionals"),
      ]);
      setServices(serviceData.services);
      setProfessionals(professionalData.professionals);
      setForm((current) => ({
        ...current,
        serviceId:
          current.serviceId ||
          serviceData.services.find((service: Service) => service.active)?.id ||
          "",
        professionalId:
          current.professionalId ||
          professionalData.professionals.find((professional: Professional) => professional.active)
            ?.id ||
          "",
      }));
      await loadDay(date);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Não foi possível carregar a agenda.",
      );
    }
  }

  useEffect(() => {
    // Agenda state is synchronized with the authenticated API on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // load intentionally runs once for the initial authenticated snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDay(date).catch((loadError) =>
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar o dia."),
    );
    // loadDay is an internal request helper; date and professional are the intended triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, filterProfessionalId]);

  async function loadWeek() {
    try {
      const dates = Array.from({ length: 7 }, (_, index) => addDays(date, index));
      const responses = await Promise.all(
        dates.map((value) =>
          requestJson(
            `/api/appointments?date=${value}${filterProfessionalId ? `&professionalId=${filterProfessionalId}` : ""}`,
          ),
        ),
      );
      setWeek(
        Object.fromEntries(dates.map((value, index) => [value, responses[index].appointments])),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar semana.");
    }
  }

  async function createManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await requestJson("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date }),
      });
      setForm((current) => ({ ...current, customerName: "", customerPhone: "" }));
      setMessage("Agendamento criado.");
      await loadDay(date);
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Erro ao criar agendamento.");
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await requestJson(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadDay(date);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Erro ao atualizar status.");
    }
  }

  const selectedProfessionals = professionals.filter(
    (professional) =>
      professional.active &&
      professional.services.some((item) => item.serviceId === form.serviceId),
  );

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Operação</span>
          <h1>Agenda</h1>
        </div>
        <div className="compact-actions">
          <Link className="small-button" href="/dashboard">
            Painel
          </Link>
          <Link className="small-button" href="/dashboard/clientes">
            Clientes
          </Link>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {message && <p className="confirmation">{message}</p>}
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="compact-actions">
          <button className="small-button" type="button" onClick={() => setDate(addDays(date, -1))}>
            Anterior
          </button>
          <input
            aria-label="Data da agenda"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <button className="small-button" type="button" onClick={() => setDate(addDays(date, 1))}>
            Próximo
          </button>
          <button
            className="small-button"
            type="button"
            onClick={() => {
              void loadWeek();
            }}
          >
            Carregar semana
          </button>
          <select
            aria-label="Filtrar por profissional"
            value={filterProfessionalId}
            onChange={(event) => setFilterProfessionalId(event.target.value)}
          >
            <option value="">Todos os profissionais</option>
            {professionals
              .filter((professional) => professional.active)
              .map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
          </select>
        </div>
      </section>
      <div className="workspace-grid">
        <section className="card">
          <div className="section-title">
            <h2>{dateFormatter.format(new Date(`${date}T12:00:00Z`))}</h2>
            <span className="muted">{appointments.length} atendimento(s)</span>
          </div>
          {appointments.length === 0 ? (
            <p className="muted">Nenhum atendimento neste dia.</p>
          ) : (
            <ul className="list">
              {appointments.map((appointment) => (
                <li className="list-item" key={appointment.id}>
                  <div>
                    <strong>
                      {timeFormatter.format(new Date(appointment.startsAt))} ·{" "}
                      {appointment.customer.name}
                    </strong>
                    <div className="muted">
                      {appointment.service.name} · {appointment.professional.name} ·{" "}
                      {appointment.customer.phone}
                    </div>
                  </div>
                  <div className="compact-actions">
                    <span className={`pill ${appointment.status.toLowerCase()}`}>
                      {appointment.status.toLowerCase()}
                    </span>
                    {appointment.status === "SCHEDULED" && (
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => updateStatus(appointment.id, "CONFIRMED")}
                      >
                        Confirmar
                      </button>
                    )}
                    {appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => updateStatus(appointment.id, "COMPLETED")}
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <div className="section-title">
            <h2>Agendamento manual</h2>
          </div>
          <form className="form-grid" onSubmit={createManual}>
            <div className="field">
              <label htmlFor="manualService">Serviço</label>
              <select
                id="manualService"
                required
                value={form.serviceId}
                onChange={(event) =>
                  setForm({ ...form, serviceId: event.target.value, professionalId: "" })
                }
              >
                {services
                  .filter((service) => service.active)
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="manualProfessional">Profissional</label>
              <select
                id="manualProfessional"
                required
                value={form.professionalId}
                onChange={(event) => setForm({ ...form, professionalId: event.target.value })}
              >
                <option value="">Selecione</option>
                {selectedProfessionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="manualTime">Horário</label>
              <input
                id="manualTime"
                required
                type="time"
                value={form.time}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="manualName">Cliente</label>
              <input
                id="manualName"
                required
                value={form.customerName}
                onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="manualPhone">WhatsApp</label>
              <input
                id="manualPhone"
                required
                value={form.customerPhone}
                onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
              />
            </div>
            <button className="button primary" type="submit">
              Criar para {date}
            </button>
          </form>
        </section>
      </div>
      {Object.keys(week).length > 0 && (
        <section className="card">
          <div className="section-title">
            <h2>Visão semanal</h2>
          </div>
          <div className="choice-grid">
            {Object.entries(week).map(([day, dayAppointments]) => (
              <div className="card" key={day}>
                <strong>{dateFormatter.format(new Date(`${day}T12:00:00Z`))}</strong>
                <p className="muted">{dayAppointments.length} atendimento(s)</p>
                {dayAppointments.map((appointment) => (
                  <div key={appointment.id} style={{ marginTop: 8 }}>
                    <strong>{timeFormatter.format(new Date(appointment.startsAt))}</strong>
                    <div className="muted">{appointment.customer.name}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
