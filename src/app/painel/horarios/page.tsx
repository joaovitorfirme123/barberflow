import { HoursPanel } from "@/components/hours-panel";
import { requirePanelUser } from "@/lib/tenant";

export default async function PanelHoursPage() {
  const user = await requirePanelUser();
  return (
    <HoursPanel
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
