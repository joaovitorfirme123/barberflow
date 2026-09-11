export type PublicBarbershop = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  logoUrl: string | null;
  timezone: string;
  services: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: number;
  }[];
  professionals: {
    id: string;
    name: string;
    photoUrl: string | null;
    serviceIds: string[];
  }[];
};

export type PanelTenant = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  role: "OWNER" | "ADMIN" | "PROFESSIONAL";
  canManage: boolean;
};
