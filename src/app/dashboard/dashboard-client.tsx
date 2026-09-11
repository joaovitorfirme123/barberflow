"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Shop = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  logoUrl: string | null;
  timezone: string;
  minBookingNoticeMinutes: number;
  maxBookingDays: number;
  slotIntervalMinutes: number;
};
type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  durationMinutes: number;
  active: boolean;
};
type Professional = {
  id: string;
  name: string;
  photoUrl: string | null;
  active: boolean;
  services: { serviceId: string }[];
};
type Hour = {
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
};
type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  service: { name: string; price: number };
  professional: { name: string };
  customer: { name: string; phone: string };
};
type ScheduleBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  professionalId: string | null;
  reason: string | null;
};

const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a operação.");
  return data;
}

export function DashboardClient() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [hours, setHours] = useState<Hour[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [metrics, setMetrics] = useState({ totalToday: 0, estimatedRevenue: 0, date: "" });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "45",
  });
  const [professionalForm, setProfessionalForm] = useState({
    name: "",
    photoUrl: "",
    serviceIds: [] as string[],
  });
  const [blockForm, setBlockForm] = useState({
    professionalId: "",
    startsAt: "",
    endsAt: "",
    reason: "",
  });
  const [shopForm, setShopForm] = useState({
    name: "",
    phone: "",
    address: "",
    instagram: "",
    logoUrl: "",
    timezone: "",
    minBookingNoticeMinutes: "60",
    maxBookingDays: "60",
    slotIntervalMinutes: "30",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [me, serviceData, professionalData, hourData, dashboard, blockData] = await Promise.all(
        [
          requestJson("/api/auth/me"),
          requestJson("/api/services"),
          requestJson("/api/professionals"),
          requestJson("/api/business-hours"),
          requestJson("/api/dashboard"),
          requestJson("/api/schedule-blocks"),
        ],
      );
      setShop(me.barbershop);
      setShopForm({
        name: me.barbershop.name,
        phone: me.barbershop.phone ?? "",
        address: me.barbershop.address ?? "",
        instagram: me.barbershop.instagram ?? "",
        logoUrl: me.barbershop.logoUrl ?? "",
        timezone: me.barbershop.timezone,
        minBookingNoticeMinutes: String(me.barbershop.minBookingNoticeMinutes),
        maxBookingDays: String(me.barbershop.maxBookingDays),
        slotIntervalMinutes: String(me.barbershop.slotIntervalMinutes),
      });
      setServices(serviceData.services);
      setProfessionals(professionalData.professionals);
      setHours(hourData.hours);
      setAppointments(dashboard.appointments);
      setUpcoming(dashboard.upcoming);
      setBlocks(blockData.blocks);
      setMetrics({
        totalToday: dashboard.totalToday,
        estimatedRevenue: dashboard.estimatedRevenue,
        date: dashboard.date,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Não foi possível carregar o painel.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // The first load synchronizes the client dashboard with the authenticated API session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await requestJson("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name,
          description: serviceForm.description || null,
          price: Number(serviceForm.price),
          durationMinutes: Number(serviceForm.durationMinutes),
        }),
      });
      setServiceForm({ name: "", description: "", price: "", durationMinutes: "45" });
      setMessage("Serviço criado.");
      await load();
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Erro ao criar serviço.");
    }
  }

  async function createProfessional(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await requestJson("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(professionalForm),
      });
      setProfessionalForm({ name: "", photoUrl: "", serviceIds: [] });
      setMessage("Profissional criado.");
      await load();
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Erro ao criar profissional.");
    }
  }

  async function saveShop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await requestJson("/api/barbershop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...shopForm,
          logoUrl: shopForm.logoUrl || null,
          phone: shopForm.phone || null,
          address: shopForm.address || null,
          instagram: shopForm.instagram || null,
          minBookingNoticeMinutes: Number(shopForm.minBookingNoticeMinutes),
          maxBookingDays: Number(shopForm.maxBookingDays),
          slotIntervalMinutes: Number(shopForm.slotIntervalMinutes),
        }),
      });
      setShop(data.barbershop);
      setMessage("Dados da barbearia atualizados.");
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Erro ao salvar dados.");
    }
  }

  async function saveHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await requestJson("/api/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      setMessage("Horários atualizados.");
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Erro ao salvar horários.");
    }
  }

  async function createBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await requestJson("/api/schedule-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: blockForm.professionalId || null,
          startsAt: new Date(blockForm.startsAt).toISOString(),
          endsAt: new Date(blockForm.endsAt).toISOString(),
          reason: blockForm.reason || null,
        }),
      });
      setBlockForm({ professionalId: "", startsAt: "", endsAt: "", reason: "" });
      setMessage("Bloqueio criado.");
      await load();
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Erro ao criar bloqueio.");
    }
  }

  async function deleteBlock(id: string) {
    try {
      await requestJson(`/api/schedule-blocks/${id}`, { method: "DELETE" });
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao remover bloqueio.");
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await requestJson(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Erro ao atualizar status.");
    }
  }

  async function toggleService(service: Service) {
    try {
      await requestJson(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !service.active }),
      });
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Erro ao atualizar serviço.");
    }
  }

  async function toggleProfessional(professional: Professional) {
    try {
      await requestJson(`/api/professionals/${professional.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !professional.active }),
      });
      await load();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Erro ao atualizar profissional.",
      );
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading)
    return (
      <main className="dashboard-shell">
        <p>Carregando painel...</p>
      </main>
    );
  if (!shop)
    return (
      <main className="dashboard-shell">
        <p className="error">
          {error || "Sessão expirada."}{" "}
          <Link className="link" href="/login">
            Entrar novamente
          </Link>
        </p>
      </main>
    );

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Painel da barbearia</span>
          <h1>{shop.name}</h1>
        </div>
        <div className="compact-actions">
          <Link className="small-button" href="/dashboard/agenda">
            Agenda
          </Link>
          <Link className="small-button" href="/dashboard/clientes">
            Clientes
          </Link>
          <a
            className="small-button"
            href={`/barbearia/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Página pública
          </a>
          <button className="small-button" type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {message && <p className="confirmation">{message}</p>}
      <section className="dashboard-grid">
        <article className="card metric">
          <span className="muted">Agendamentos hoje</span>
          <strong>{metrics.totalToday}</strong>
          <span className="muted">{metrics.date}</span>
        </article>
        <article className="card metric">
          <span className="muted">Previsão do dia</span>
          <strong>R$ {metrics.estimatedRevenue.toFixed(2)}</strong>
          <span className="muted">Sem pagamentos online</span>
        </article>
        <article className="card metric">
          <span className="muted">Link público</span>
          <strong>/{shop.slug}</strong>
          <span className="muted">Compartilhe no WhatsApp e Instagram</span>
        </article>
      </section>
      <div className="workspace-grid">
        <section className="card">
          <div className="section-title">
            <h2>Agenda de hoje</h2>
          </div>
          {appointments.length === 0 ? (
            <p className="muted">Nenhum atendimento agendado para hoje.</p>
          ) : (
            <ul className="list">
              {appointments.map((appointment) => (
                <li className="list-item" key={appointment.id}>
                  <div>
                    <strong>
                      {new Intl.DateTimeFormat("pt-BR", {
                        timeZone: shop.timezone,
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(appointment.startsAt))}{" "}
                      · {appointment.customer.name}
                    </strong>
                    <div className="muted">
                      {appointment.service.name} com {appointment.professional.name}
                    </div>
                  </div>
                  <div className="compact-actions">
                    <span className={`pill ${appointment.status.toLowerCase()}`}>
                      {appointment.status.toLowerCase()}
                    </span>
                    {appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => updateStatus(appointment.id, "COMPLETED")}
                      >
                        Concluir
                      </button>
                    )}
                    {appointment.status !== "CANCELLED" && (
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => {
                          if (window.confirm("Cancelar este atendimento?")) {
                            void updateStatus(appointment.id, "CANCELLED");
                          }
                        }}
                      >
                        Cancelar
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
            <h2>Novo serviço</h2>
          </div>
          <form className="form-grid" onSubmit={createService}>
            <div className="field">
              <label htmlFor="serviceName">Nome</label>
              <input
                id="serviceName"
                required
                value={serviceForm.name}
                onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="serviceDescription">Descrição (opcional)</label>
              <textarea
                id="serviceDescription"
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, description: event.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="servicePrice">Preço</label>
              <input
                id="servicePrice"
                required
                min="0"
                step="0.01"
                type="number"
                value={serviceForm.price}
                onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="serviceDuration">Duração (minutos)</label>
              <input
                id="serviceDuration"
                required
                min="5"
                type="number"
                value={serviceForm.durationMinutes}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, durationMinutes: event.target.value })
                }
              />
            </div>
            <button className="button primary" type="submit">
              Adicionar serviço
            </button>
          </form>
          <ul className="list" style={{ marginTop: 20 }}>
            {services.map((service) => (
              <li className="list-item" key={service.id}>
                <span>
                  <strong>{service.name}</strong>
                  <br />
                  <span className="muted">
                    R$ {Number(service.price).toFixed(2)} · {service.durationMinutes} min
                  </span>
                </span>
                <div className="compact-actions">
                  <span className="pill">{service.active ? "ativo" : "inativo"}</span>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => toggleService(service)}
                  >
                    {service.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>Próximos atendimentos</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">Nenhum próximo atendimento.</p>
        ) : (
          <ul className="list">
            {upcoming.map((appointment) => (
              <li className="list-item" key={appointment.id}>
                <span>
                  <strong>
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: shop.timezone,
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(appointment.startsAt))}
                  </strong>
                  <br />
                  <span className="muted">
                    {appointment.customer.name} · {appointment.service.name} ·{" "}
                    {appointment.professional.name}
                  </span>
                </span>
                <span className={`pill ${appointment.status.toLowerCase()}`}>
                  {appointment.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="workspace-grid">
        <section className="card">
          <div className="section-title">
            <h2>Profissionais</h2>
          </div>
          <form className="form-grid" onSubmit={createProfessional}>
            <div className="field">
              <label htmlFor="professionalName">Nome</label>
              <input
                id="professionalName"
                required
                value={professionalForm.name}
                onChange={(event) =>
                  setProfessionalForm({ ...professionalForm, name: event.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="professionalPhoto">URL da foto (opcional)</label>
              <input
                id="professionalPhoto"
                type="url"
                value={professionalForm.photoUrl}
                onChange={(event) =>
                  setProfessionalForm({ ...professionalForm, photoUrl: event.target.value })
                }
              />
            </div>
            <div className="field">
              <span>Serviços executados</span>
              {services
                .filter((service) => service.active)
                .map((service) => (
                  <label key={service.id}>
                    <input
                      type="checkbox"
                      checked={professionalForm.serviceIds.includes(service.id)}
                      onChange={(event) =>
                        setProfessionalForm({
                          ...professionalForm,
                          serviceIds: event.target.checked
                            ? [...professionalForm.serviceIds, service.id]
                            : professionalForm.serviceIds.filter((id) => id !== service.id),
                        })
                      }
                    />{" "}
                    {service.name}
                  </label>
                ))}
            </div>
            <button className="button primary" type="submit">
              Adicionar profissional
            </button>
          </form>
          <ul className="list" style={{ marginTop: 20 }}>
            {professionals.map((professional) => (
              <li className="list-item" key={professional.id}>
                <span>
                  {professional.name}
                  <br />
                  <span className="muted">{professional.services.length} serviço(s)</span>
                </span>
                <div className="compact-actions">
                  <span className="pill">{professional.active ? "ativo" : "inativo"}</span>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => toggleProfessional(professional)}
                  >
                    {professional.active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <div className="section-title">
            <h2>Horário de funcionamento</h2>
          </div>
          <form className="hours-grid" onSubmit={saveHours}>
            {hours.map((hour) => (
              <div className="hours-row" key={hour.weekday}>
                <strong>{weekdays[hour.weekday]}</strong>
                <input
                  aria-label={`${weekdays[hour.weekday]} abertura`}
                  type="time"
                  value={hour.openTime}
                  disabled={hour.closed}
                  onChange={(event) =>
                    setHours(
                      hours.map((current) =>
                        current.weekday === hour.weekday
                          ? { ...current, openTime: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${weekdays[hour.weekday]} fechamento`}
                  type="time"
                  value={hour.closeTime}
                  disabled={hour.closed}
                  onChange={(event) =>
                    setHours(
                      hours.map((current) =>
                        current.weekday === hour.weekday
                          ? { ...current, closeTime: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${weekdays[hour.weekday]} início do intervalo`}
                  type="time"
                  value={hour.breakStart ?? ""}
                  disabled={hour.closed}
                  onChange={(event) =>
                    setHours(
                      hours.map((current) =>
                        current.weekday === hour.weekday
                          ? { ...current, breakStart: event.target.value || null }
                          : current,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${weekdays[hour.weekday]} fim do intervalo`}
                  type="time"
                  value={hour.breakEnd ?? ""}
                  disabled={hour.closed}
                  onChange={(event) =>
                    setHours(
                      hours.map((current) =>
                        current.weekday === hour.weekday
                          ? { ...current, breakEnd: event.target.value || null }
                          : current,
                      ),
                    )
                  }
                />
                <label>
                  <input
                    type="checkbox"
                    checked={hour.closed}
                    onChange={(event) =>
                      setHours(
                        hours.map((current) =>
                          current.weekday === hour.weekday
                            ? { ...current, closed: event.target.checked }
                            : current,
                        ),
                      )
                    }
                  />{" "}
                  fechado
                </label>
              </div>
            ))}
            <button className="button primary" type="submit">
              Salvar horários
            </button>
          </form>
        </section>
      </div>
      <section className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h2>Bloqueios e folgas</h2>
        </div>
        <form className="form-grid" onSubmit={createBlock}>
          <div className="field">
            <label htmlFor="blockProfessional">Profissional (opcional)</label>
            <select
              id="blockProfessional"
              value={blockForm.professionalId}
              onChange={(event) =>
                setBlockForm({ ...blockForm, professionalId: event.target.value })
              }
            >
              <option value="">Toda a barbearia</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="blockStartsAt">Início</label>
            <input
              id="blockStartsAt"
              required
              type="datetime-local"
              value={blockForm.startsAt}
              onChange={(event) => setBlockForm({ ...blockForm, startsAt: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="blockEndsAt">Fim</label>
            <input
              id="blockEndsAt"
              required
              type="datetime-local"
              value={blockForm.endsAt}
              onChange={(event) => setBlockForm({ ...blockForm, endsAt: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="blockReason">Motivo</label>
            <input
              id="blockReason"
              placeholder="Folga, almoço extra..."
              value={blockForm.reason}
              onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
            />
          </div>
          <button className="button primary" type="submit">
            Bloquear horário
          </button>
        </form>
        {blocks.length > 0 && (
          <ul className="list" style={{ marginTop: 20 }}>
            {blocks.map((block) => (
              <li className="list-item" key={block.id}>
                <span>
                  <strong>
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(block.startsAt))}{" "}
                    até{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(block.endsAt))}
                  </strong>
                  <br />
                  <span className="muted">{block.reason || "Toda a barbearia"}</span>
                </span>
                <button
                  className="small-button"
                  type="button"
                  onClick={() => deleteBlock(block.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <div className="section-title">
          <h2>Dados da barbearia</h2>
        </div>
        <form className="form-grid" onSubmit={saveShop}>
          <div className="field">
            <label htmlFor="shopName">Nome</label>
            <input
              id="shopName"
              required
              value={shopForm.name}
              onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="shopPhone">WhatsApp</label>
            <input
              id="shopPhone"
              value={shopForm.phone}
              onChange={(event) => setShopForm({ ...shopForm, phone: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="shopAddress">Endereço</label>
            <input
              id="shopAddress"
              value={shopForm.address}
              onChange={(event) => setShopForm({ ...shopForm, address: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="shopInstagram">Instagram</label>
            <input
              id="shopInstagram"
              value={shopForm.instagram}
              onChange={(event) => setShopForm({ ...shopForm, instagram: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="shopLogo">URL da logo</label>
            <input
              id="shopLogo"
              type="url"
              value={shopForm.logoUrl}
              onChange={(event) => setShopForm({ ...shopForm, logoUrl: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="shopTimezone">Timezone IANA</label>
            <input
              id="shopTimezone"
              required
              value={shopForm.timezone}
              onChange={(event) => setShopForm({ ...shopForm, timezone: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="minNotice">Antecedência mínima (minutos)</label>
            <input
              id="minNotice"
              min="0"
              type="number"
              value={shopForm.minBookingNoticeMinutes}
              onChange={(event) =>
                setShopForm({ ...shopForm, minBookingNoticeMinutes: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="maxDays">Dias futuros disponíveis</label>
            <input
              id="maxDays"
              min="1"
              type="number"
              value={shopForm.maxBookingDays}
              onChange={(event) => setShopForm({ ...shopForm, maxBookingDays: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="slotInterval">Intervalo entre horários (minutos)</label>
            <input
              id="slotInterval"
              min="5"
              type="number"
              value={shopForm.slotIntervalMinutes}
              onChange={(event) =>
                setShopForm({ ...shopForm, slotIntervalMinutes: event.target.value })
              }
            />
          </div>
          <button className="button primary" type="submit">
            Salvar dados
          </button>
        </form>
      </section>
    </main>
  );
}
