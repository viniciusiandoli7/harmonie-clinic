import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePatientSchema } from "@/lib/patientSchemaSql";

type Context = { params: Promise<{ id: string }> };

function bool(value: unknown) {
  return value === true || value === "true" || value === "sim" || value === "on" || value === 1 || value === "1";
}

function text(value: unknown) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

async function getPatient(id: string) {
  const rows = await (prisma as any).$queryRawUnsafe(
    `SELECT "id", "name", "phone" FROM "Patient" WHERE "id" = $1 LIMIT 1`,
    id
  );
  return Array.isArray(rows) ? rows[0] : null;
}

async function getAnamnesis(id: string) {
  const rows = await (prisma as any).$queryRawUnsafe(
    `SELECT * FROM "PatientAnamnesis" WHERE "patientId" = $1 LIMIT 1`,
    id
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function GET(_req: NextRequest, context: Context) {
  const { id } = await context.params;

  try {
    await ensurePatientSchema(prisma as any);

    const patient = await getPatient(id);
    if (!patient) return NextResponse.json({ error: "Paciente não encontrada." }, { status: 404 });

    const anamnesis = await getAnamnesis(id);

    return NextResponse.json({
      patient,
      anamnesis,
    });
  } catch (error: any) {
    console.error("Erro ao carregar anamnese pública:", error);
    return NextResponse.json({ error: "Não foi possível carregar a ficha." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: Context) {
  const { id } = await context.params;

  try {
    await ensurePatientSchema(prisma as any);

    const patient = await getPatient(id);
    if (!patient) return NextResponse.json({ error: "Paciente não encontrada." }, { status: 404 });

    const body = await req.json();

    const payload = {
      profession: text(body.profession),
      sunExposure: bool(body.sunExposure),
      mainComplaint: text(body.mainComplaint),
      previousAestheticProcedures: text(body.previousAestheticProcedures),
      takingRoacutan: bool(body.takingRoacutan),
      roacutanDetails: text(body.roacutanDetails),
      medications: text(body.medications),
      allergies: text(body.allergies),
      allergicToEgg: bool(body.allergicToEgg),
      allergicToSeafood: text(body.allergicToSeafood),
      dentalAnesthesia: bool(body.dentalAnesthesia),
      dentalAnesthesiaReaction: bool(body.dentalAnesthesiaReaction),
      procedureReaction: text(body.procedureReaction),
      keloidTendency: bool(body.keloidTendency),
      diseases: text(body.diseases),
      hasHerpes: bool(body.hasHerpes),
      smoker: bool(body.smoker),
      bloodPressure: text(body.bloodPressure),
      waterIntake: text(body.waterIntake),
      pregnantOrNursing: bool(body.pregnantOrNursing),
      exercises: bool(body.exercises),
      skinCareRoutine: text(body.skinCareRoutine),
      weightLoss: text(body.weightLoss),
      surgeries: text(body.surgeries),
      recentTreatmentOrVaccine: text(body.recentTreatmentOrVaccine),
      hasAutoimmuneDisease: bool(body.hasAutoimmuneDisease),
      cancerHistory: bool(body.cancerHistory),
      hasDiabetes: bool(body.hasDiabetes),
      usesAnticoagulant: bool(body.usesAnticoagulant),
      usesAspirin: bool(body.usesAspirin),
      circulationProblems: text(body.circulationProblems),
      permanentImplants: text(body.permanentImplants),
      consentSigned: bool(body.consentSigned),
      clinicalRiskNotes: text(body.clinicalRiskNotes),
    };

    if (!payload.consentSigned) {
      return NextResponse.json({ error: "É necessário confirmar a veracidade das informações." }, { status: 400 });
    }

    const existing = await getAnamnesis(id);

    if (existing) {
      const rows = await (prisma as any).$queryRawUnsafe(
        `
          UPDATE "PatientAnamnesis"
          SET
            "profession" = $2,
            "sunExposure" = $3,
            "mainComplaint" = $4,
            "previousAestheticProcedures" = $5,
            "takingRoacutan" = $6,
            "roacutanDetails" = $7,
            "medications" = $8,
            "allergies" = $9,
            "allergicToEgg" = $10,
            "allergicToSeafood" = $11,
            "dentalAnesthesia" = $12,
            "dentalAnesthesiaReaction" = $13,
            "procedureReaction" = $14,
            "keloidTendency" = $15,
            "diseases" = $16,
            "hasHerpes" = $17,
            "smoker" = $18,
            "bloodPressure" = $19,
            "waterIntake" = $20,
            "pregnantOrNursing" = $21,
            "exercises" = $22,
            "skinCareRoutine" = $23,
            "weightLoss" = $24,
            "surgeries" = $25,
            "recentTreatmentOrVaccine" = $26,
            "hasAutoimmuneDisease" = $27,
            "cancerHistory" = $28,
            "hasDiabetes" = $29,
            "usesAnticoagulant" = $30,
            "usesAspirin" = $31,
            "circulationProblems" = $32,
            "permanentImplants" = $33,
            "consentSigned" = $34,
            "clinicalRiskNotes" = $35,
            "updatedAt" = NOW()
          WHERE "patientId" = $1
          RETURNING *
        `,
        id,
        payload.profession,
        payload.sunExposure,
        payload.mainComplaint,
        payload.previousAestheticProcedures,
        payload.takingRoacutan,
        payload.roacutanDetails,
        payload.medications,
        payload.allergies,
        payload.allergicToEgg,
        payload.allergicToSeafood,
        payload.dentalAnesthesia,
        payload.dentalAnesthesiaReaction,
        payload.procedureReaction,
        payload.keloidTendency,
        payload.diseases,
        payload.hasHerpes,
        payload.smoker,
        payload.bloodPressure,
        payload.waterIntake,
        payload.pregnantOrNursing,
        payload.exercises,
        payload.skinCareRoutine,
        payload.weightLoss,
        payload.surgeries,
        payload.recentTreatmentOrVaccine,
        payload.hasAutoimmuneDisease,
        payload.cancerHistory,
        payload.hasDiabetes,
        payload.usesAnticoagulant,
        payload.usesAspirin,
        payload.circulationProblems,
        payload.permanentImplants,
        payload.consentSigned,
        payload.clinicalRiskNotes
      );

      return NextResponse.json({ ok: true, anamnesis: Array.isArray(rows) ? rows[0] : rows });
    }

    const rows = await (prisma as any).$queryRawUnsafe(
      `
        INSERT INTO "PatientAnamnesis" (
          "id", "patientId", "profession", "sunExposure", "mainComplaint", "previousAestheticProcedures",
          "takingRoacutan", "roacutanDetails", "medications", "allergies", "allergicToEgg", "allergicToSeafood",
          "dentalAnesthesia", "dentalAnesthesiaReaction", "procedureReaction", "keloidTendency", "diseases",
          "hasHerpes", "smoker", "bloodPressure", "waterIntake", "pregnantOrNursing", "exercises",
          "skinCareRoutine", "weightLoss", "surgeries", "recentTreatmentOrVaccine", "hasAutoimmuneDisease",
          "cancerHistory", "hasDiabetes", "usesAnticoagulant", "usesAspirin", "circulationProblems",
          "permanentImplants", "consentSigned", "clinicalRiskNotes", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33,
          $34, $35, $36, NOW(), NOW()
        )
        RETURNING *
      `,
      randomUUID(),
      id,
      payload.profession,
      payload.sunExposure,
      payload.mainComplaint,
      payload.previousAestheticProcedures,
      payload.takingRoacutan,
      payload.roacutanDetails,
      payload.medications,
      payload.allergies,
      payload.allergicToEgg,
      payload.allergicToSeafood,
      payload.dentalAnesthesia,
      payload.dentalAnesthesiaReaction,
      payload.procedureReaction,
      payload.keloidTendency,
      payload.diseases,
      payload.hasHerpes,
      payload.smoker,
      payload.bloodPressure,
      payload.waterIntake,
      payload.pregnantOrNursing,
      payload.exercises,
      payload.skinCareRoutine,
      payload.weightLoss,
      payload.surgeries,
      payload.recentTreatmentOrVaccine,
      payload.hasAutoimmuneDisease,
      payload.cancerHistory,
      payload.hasDiabetes,
      payload.usesAnticoagulant,
      payload.usesAspirin,
      payload.circulationProblems,
      payload.permanentImplants,
      payload.consentSigned,
      payload.clinicalRiskNotes
    );

    return NextResponse.json({ ok: true, anamnesis: Array.isArray(rows) ? rows[0] : rows });
  } catch (error: any) {
    console.error("Erro ao salvar anamnese pública:", error);
    return NextResponse.json({ error: "Não foi possível salvar a ficha." }, { status: 500 });
  }
}
