import { PanelDashboard } from "@/components/panel-dashboard";
import { requirePanelUser } from "@/lib/tenant";

export default async function PanelPage() {
  const user = await requirePanelUser();
  return (
    <PanelDashboard
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
