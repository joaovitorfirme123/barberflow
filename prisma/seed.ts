import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error("SEED_DEMO_PASSWORD deve ter pelo menos 8 caracteres");
  }
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const barbershop = await prisma.barbershop.upsert({
    where: { slug: "barbearia-demo" },
    update: {},
    create: {
      name: "Barbearia Demo",
      slug: "barbearia-demo",
      phone: "5511999999999",
      address: "Rua Principal, 100",
      instagram: "@barbeariademo",
      timezone: "America/Sao_Paulo",
    },
  });

  await prisma.user.upsert({
    where: {
      barbershopId_email: {
        barbershopId: barbershop.id,
        email: "dono@barbeariademo.local",
      },
    },
    update: { passwordHash, active: true },
    create: {
      barbershopId: barbershop.id,
      name: "Dono da Barbearia Demo",
      email: "dono@barbeariademo.local",
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  const service = await prisma.service.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      barbershopId: barbershop.id,
      name: "Corte masculino",
      description: "Corte personalizado com acabamento.",
      price: 35,
      durationMinutes: 45,
    },
  });

  const professional = await prisma.professional.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      barbershopId: barbershop.id,
      name: "João Barber",
    },
  });

  await prisma.professionalService.upsert({
    where: {
      professionalId_serviceId: {
        professionalId: professional.id,
        serviceId: service.id,
      },
    },
    update: {},
    create: { professionalId: professional.id, serviceId: service.id },
  });

  for (let weekday = 0; weekday < 7; weekday += 1) {
    await prisma.businessHour.upsert({
      where: { barbershopId_weekday: { barbershopId: barbershop.id, weekday } },
      update: {},
      create: {
        barbershopId: barbershop.id,
        weekday,
        openTime: "09:00",
        closeTime: "19:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        closed: weekday === 0,
      },
    });
  }

  console.log(`Seed concluído para ${barbershop.name} (${barbershop.slug}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
