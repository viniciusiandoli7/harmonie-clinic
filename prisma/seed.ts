import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Cria profissionais de exemplo
    await prisma.professional.createMany({
      data: [
        { name: "Dra. Ana Paula", commission: 0.3, isActive: true },
        { name: "Sala A", commission: 0.2, isActive: true },
        { name: "Sala B", commission: 0.2, isActive: true }
      ],
      skipDuplicates: true
    });


    // Cria tratamentos (serviços) de exemplo
    await prisma.treatment.createMany({
      data: [
        {
          name: "Consulta Inicial",
          template: "Contrato de consulta inicial."
        },
        {
          name: "Retorno",
          template: "Contrato de retorno."
        },
        {
          name: "Procedimento Estético",
          template: "Contrato de procedimento estético."
        }
      ],
      skipDuplicates: true
    });

  await prisma.treatment.createMany({
    data: [
      {
        name: "Botox",
        template: "Contrato de aplicação de toxina botulínica..."
      },
      {
        name: "Preenchimento labial",
        template: "Contrato de preenchimento com ácido hialurônico..."
      },
      {
        name: "Ultrassom micro e macrofocado",
        template: "Contrato de ultrassom facial..."
      }
    ],
    skipDuplicates: true
  });

  console.log("Tratamentos criados 🚀");
}

main().finally(() => prisma.$disconnect());
