import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BarberPlan | Agenda da barbearia",
    short_name: "BarberPlan",
    description: "Agenda operacional simples para barbearias.",
    id: "/painel",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#16120f",
    theme_color: "#16120f",
    lang: "pt-BR",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
