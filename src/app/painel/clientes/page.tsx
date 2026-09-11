import { ClientsPanel } from "@/components/clients-panel";
import { requirePanelUser } from "@/lib/tenant";

export default async function PanelClientsPage() {
  const user = await requirePanelUser();
  return (
    <ClientsPanel
      tenant={{
        id: user.barbershop.id,
        name: user.barbershop.name,
        slug: user.barbershop.slug,
        timezone: user.barbershop.timezone,
        role: user.role,
        canManage: user.role === "OWNER" || user.role === "ADMIN",
      }}
    />
  );
}
