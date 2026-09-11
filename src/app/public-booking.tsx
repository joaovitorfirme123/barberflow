"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
};
type Professional = { id: string; name: string; photoUrl: string | null; serviceIds: string[] };
type Shop = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  logoUrl: string | null;
  timezone: string;
  services: Service[];
  professionals: Professional[];
};

export function PublicBooking({ slug }: { slug: string }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [confirmation, setConfirmation] = useState<{ id: string; whatsappUrl: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/barbershops/${slug}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setShop(data.barbershop);
        setServiceId(data.barbershop.services[0]?.id ?? "");
        setProfessionalId(
          data.barbershop.professionals.find((professional: Professional) =>
            professional.serviceIds.includes(data.barbershop.services[0]?.id),
          )?.id ?? "",
        );
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Barbearia não encontrada."),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  const availableProfessionals =
    shop?.professionals.filter((professional) => professional.serviceIds.includes(serviceId)) ?? [];

  useEffect(() => {
    if (!serviceId || !professionalId || !date) return;
    fetch(
      `/api/public/barbershops/${slug}/availability?date=${date}&serviceId=${serviceId}&professionalId=${professionalId}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSlots(data.slots);
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error ? loadError.message : "Não foi possível carregar horários.",
        ),
      );
  }, [date, professionalId, serviceId, slug]);

  function chooseService(id: string) {
    setServiceId(id);
    setTime("");
    setProfessionalId(
      shop?.professionals.find((professional) => professional.serviceIds.includes(id))?.id ?? "",
    );
  }

  async function book(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/public/barbershops/${slug}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        professionalId,
        date,
        time,
        customerName: customer.name,
        customerPhone: customer.phone,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Não foi possível agendar.");
      return;
    }
    setConfirmation({ id: data.appointment.id, whatsappUrl: data.whatsappUrl });
  }

  if (loading)
    return (
      <main className="public-shell">
        <p>Carregando...</p>
      </main>
    );
  if (!shop)
    return (
      <main className="public-shell">
        <p className="error">{error || "Barbearia não encontrada."}</p>
      </main>
    );

  const selectedService = shop.services.find((service) => service.id === serviceId);
  const selectedProfessional = shop.professionals.find(
    (professional) => professional.id === professionalId,
  );

  return (
    <main className="public-shell">
      <header className="public-header">
        <span className="eyebrow">Agendamento online</span>
        {shop.logoUrl && (
          // Logos are user-provided URLs; Next Image would require an allowlist per provider.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="public-logo" src={shop.logoUrl} alt={`Logo da ${shop.name}`} />
        )}
        <h1>{shop.name}</h1>
        <p>{shop.address || "Escolha um serviço e encontre seu próximo horário."}</p>
        {shop.instagram && <p>{shop.instagram}</p>}
      </header>
      {confirmation ? (
        <section className="confirmation">
          <h2>Horário confirmado.</h2>
          <p>
            Seu agendamento com {selectedProfessional?.name} para {selectedService?.name} foi
            criado.
          </p>
          <a className="button" href={confirmation.whatsappUrl} target="_blank" rel="noreferrer">
            Avisar pelo WhatsApp
          </a>
          <p className="muted">Código: {confirmation.id}</p>
        </section>
      ) : (
        <div className="stack">
          {error && <p className="error">{error}</p>}
          <section className="card">
            <div className="section-title">
              <h2>1. Escolha o serviço</h2>
            </div>
            <div className="choice-grid">
              {shop.services.map((service) => (
                <button
                  className={`choice ${service.id === serviceId ? "active" : ""}`}
                  key={service.id}
                  type="button"
                  onClick={() => chooseService(service.id)}
                >
                  <strong>{service.name}</strong>
                  <span>
                    R$ {service.price.toFixed(2)} · {service.durationMinutes} min
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="section-title">
              <h2>2. Escolha o profissional</h2>
            </div>
            <div className="choice-grid">
              {availableProfessionals.map((professional) => (
                <button
                  className={`choice ${professional.id === professionalId ? "active" : ""}`}
                  key={professional.id}
                  type="button"
                  onClick={() => {
                    setProfessionalId(professional.id);
                    setTime("");
                  }}
                >
                  <strong>{professional.name}</strong>
                  <span>Disponível para este serviço</span>
                </button>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="section-title">
              <h2>3. Escolha data e horário</h2>
            </div>
            <div className="field">
              <label htmlFor="date">Data</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                }}
              />
            </div>
            <div className="slot-grid" style={{ marginTop: 16 }}>
              {slots.length ? (
                slots.map((slot) => {
                  const label = new Intl.DateTimeFormat("pt-BR", {
                    timeZone: shop.timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(slot));
                  return (
                    <button
                      className={`small-button ${time === label ? "active" : ""}`}
                      key={slot}
                      type="button"
                      onClick={() => setTime(label)}
                    >
                      {label}
                    </button>
                  );
                })
              ) : (
                <span className="muted">Nenhum horário disponível para esta data.</span>
              )}
            </div>
          </section>
          <section className="card">
            <div className="section-title">
              <h2>4. Seus dados</h2>
            </div>
            {time && (
              <div className="card" style={{ marginBottom: 16 }}>
                <strong>Resumo do agendamento</strong>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  {selectedService?.name} com {selectedProfessional?.name} em {date} às {time}.
                </p>
              </div>
            )}
            <form className="form-grid" onSubmit={book}>
              <div className="field">
                <label htmlFor="customerName">Nome</label>
                <input
                  id="customerName"
                  required
                  value={customer.name}
                  onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="customerPhone">WhatsApp</label>
                <input
                  id="customerPhone"
                  required
                  inputMode="tel"
                  value={customer.phone}
                  onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                />
              </div>
              <button
                className="button primary"
                disabled={!time || !selectedService || !selectedProfessional}
                type="submit"
              >
                Confirmar agendamento
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
