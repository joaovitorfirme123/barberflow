import { ServicesPanel } from "@/components/services-panel";
import { requirePanelUser } from "@/lib/tenant";

export default async function PanelServicesPage() {
  const user = await requirePanelUser();
  return (
    <ServicesPanel
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
