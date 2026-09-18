import { SettingsPanel } from "@/components/settings-panel";
import { requirePanelUser } from "@/lib/tenant";

export default async function SettingsPage() {
  const user = await requirePanelUser();
  return (
    <SettingsPanel
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
