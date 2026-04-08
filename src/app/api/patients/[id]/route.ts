import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getPatientById, updatePatient } from "@/services/patientService";
import { updatePatientSchema } from "@/validators/patientValidator";

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = paramsSchema.parse(await context.params);
    const patient = await getPatientById(id);
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar paciente" }, { status: 400 });
  }
}

export async function PATCH(req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = paramsSchema.parse(await context.params);
    const body = await req.json();
    const data = updatePatientSchema.parse(body);
    const patient = await updatePatient(id, data as any);
    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = paramsSchema.parse(await context.params);

    await prisma.$transaction([
      // 1. Apagar Sessões de Evolução (Netos)
      prisma.clinicalEvolutionSession.deleteMany({ where: { plan: { patientId: id } } }),
      // 2. Apagar Planos de Evolução
      prisma.clinicalEvolutionPlan.deleteMany({ where: { patientId: id } }),
      // 3. Apagar Evoluções Manuais e Prontuários
      prisma.clinicalEvolution.deleteMany({ where: { patientId: id } }),
      prisma.medicalRecord.deleteMany({ where: { patientId: id } }),
      prisma.patientAnamnesis.deleteMany({ where: { patientId: id } }),

      // 4. Apagar Itens de Venda e Pagamentos (Netos do Financeiro)
      prisma.saleItem.deleteMany({ where: { sale: { patientId: id } } }),
      prisma.salePayment.deleteMany({ where: { sale: { patientId: id } } }),
      
      // 5. Apagar Transações e Vendas
      prisma.financialTransaction.deleteMany({ where: { patientId: id } }),
      prisma.sale.deleteMany({ where: { patientId: id } }),

      // 6. Documentos, Contratos e Agendamentos
      prisma.patientConsentDocument.deleteMany({ where: { patientId: id } }),
      prisma.patientContract.deleteMany({ where: { patientId: id } }),
      prisma.appointment.deleteMany({ where: { patientId: id } }),

      // 7. Por fim, o Paciente
      prisma.patient.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    console.error("ERRO CRÍTICO NA EXCLUSÃO:", error);
    return NextResponse.json({ error: "Falha ao excluir registros vinculados." }, { status: 500 });
  }
}