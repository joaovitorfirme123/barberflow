import { PublicBooking } from "@/app/public-booking";

export default async function PublicBarbershopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicBooking slug={slug} />;
}
