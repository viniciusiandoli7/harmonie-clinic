import { Prisma } from "@prisma/client";

type PatientPayload = Record<string, unknown>;

function toNullableString(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toRequiredString(value: unknown) {
  return String(value ?? "").trim();
}

function toNullableDate(value: unknown) {
  const text = toNullableString(value);
  if (!text) return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000`)
    : new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toNullableNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;

  const normalized = String(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

export function buildPatientCreateData(body: PatientPayload): Prisma.PatientCreateInput {
  return {
    name: toRequiredString(body.name),
    email: toNullableString(body.email),
    phone: toNullableString(body.phone),
    birthDate: toNullableDate(body.birthDate),
    cpf: toNullableString(body.cpf),
    rg: toNullableString(body.rg),
    address: toNullableString(body.address),
    addressNumber: toNullableString(body.addressNumber),
    addressComplement: toNullableString(body.addressComplement),
    neighborhood: toNullableString(body.neighborhood),
    city: toNullableString(body.city),
    state: toNullableString(body.state),
    zipCode: toNullableString(body.zipCode),
    crmSource: toNullableString(body.crmSource),
    referralName: toNullableString(body.referralName),
    crmStatus: toNullableString(body.crmStatus) || "Novo Lead",
    imageAuthorized: toBoolean(body.imageAuthorized),
    interestProcedure: toNullableString(body.interestProcedure),
    patientProfile: toNullableString(body.patientProfile),
    commercialNotes: toNullableString(body.commercialNotes),
    conversionStatus: toNullableString(body.conversionStatus),
    proposedValue: toNullableNumber(body.proposedValue),
    closedValue: toNullableNumber(body.closedValue),
    lostReason: toNullableString(body.lostReason),
    firstEvaluationAt: toNullableDate(body.firstEvaluationAt),
    nextSuggestedAt: toNullableDate(body.nextSuggestedAt),
    notes: toNullableString(body.notes),
    isActive: body.isActive === undefined ? true : toBoolean(body.isActive),
    anamnesis: {
      create: buildAnamnesisData(body),
    },
  };
}

export function buildPatientUpdateData(body: PatientPayload): Prisma.PatientUpdateInput {
  const data: Prisma.PatientUpdateInput = {};

  if (body.name !== undefined) data.name = toRequiredString(body.name);
  if (body.email !== undefined) data.email = toNullableString(body.email);
  if (body.phone !== undefined) data.phone = toNullableString(body.phone);
  if (body.birthDate !== undefined) data.birthDate = toNullableDate(body.birthDate);
  if (body.cpf !== undefined) data.cpf = toNullableString(body.cpf);
  if (body.rg !== undefined) data.rg = toNullableString(body.rg);
  if (body.address !== undefined) data.address = toNullableString(body.address);
  if (body.addressNumber !== undefined) data.addressNumber = toNullableString(body.addressNumber);
  if (body.addressComplement !== undefined) data.addressComplement = toNullableString(body.addressComplement);
  if (body.neighborhood !== undefined) data.neighborhood = toNullableString(body.neighborhood);
  if (body.city !== undefined) data.city = toNullableString(body.city);
  if (body.state !== undefined) data.state = toNullableString(body.state);
  if (body.zipCode !== undefined) data.zipCode = toNullableString(body.zipCode);
  if (body.crmSource !== undefined) data.crmSource = toNullableString(body.crmSource);
  if (body.referralName !== undefined) data.referralName = toNullableString(body.referralName);
  if (body.crmStatus !== undefined) data.crmStatus = toNullableString(body.crmStatus) || "Novo Lead";
  if (body.imageAuthorized !== undefined) data.imageAuthorized = toBoolean(body.imageAuthorized);
  if (body.interestProcedure !== undefined) data.interestProcedure = toNullableString(body.interestProcedure);
  if (body.patientProfile !== undefined) data.patientProfile = toNullableString(body.patientProfile);
  if (body.commercialNotes !== undefined) data.commercialNotes = toNullableString(body.commercialNotes);
  if (body.conversionStatus !== undefined) data.conversionStatus = toNullableString(body.conversionStatus);
  if (body.proposedValue !== undefined) data.proposedValue = toNullableNumber(body.proposedValue);
  if (body.closedValue !== undefined) data.closedValue = toNullableNumber(body.closedValue);
  if (body.lostReason !== undefined) data.lostReason = toNullableString(body.lostReason);
  if (body.firstEvaluationAt !== undefined) data.firstEvaluationAt = toNullableDate(body.firstEvaluationAt);
  if (body.nextSuggestedAt !== undefined) data.nextSuggestedAt = toNullableDate(body.nextSuggestedAt);
  if (body.notes !== undefined) data.notes = toNullableString(body.notes);
  if (body.isActive !== undefined) data.isActive = toBoolean(body.isActive);

  data.anamnesis = {
    upsert: {
      create: buildAnamnesisData(body),
      update: buildAnamnesisData(body),
    },
  };

  return data;
}

export function buildAnamnesisData(body: PatientPayload): Prisma.PatientAnamnesisCreateWithoutPatientInput {
  return {
    profession: toNullableString(body.profession),
    sunExposure: toBoolean(body.sunExposure),
    mainComplaint: toNullableString(body.mainComplaint),
    previousFillers: toNullableString(body.previousFillers),
    previousBotox: toNullableString(body.previousBotox),
    takingRoacutan: toBoolean(body.takingRoacutan),
    medications: toNullableString(body.medications),
    allergicToEgg: toBoolean(body.allergicToEgg),
    allergicToSeafood: toNullableString(body.allergicToSeafood),
    dentalAnesthesia: toBoolean(body.dentalAnesthesia),
    dentalAnesthesiaReaction: toBoolean(body.dentalAnesthesiaReaction),
    procedureReaction: toNullableString(body.procedureReaction),
    keloidTendency: toBoolean(body.keloidTendency),
    degenerativeDisease: toNullableString(body.degenerativeDisease),
    diseases: toNullableString(body.diseases),
    allergies: toNullableString(body.allergies),
    hasHerpes: toBoolean(body.hasHerpes),
    usesAspirin: toBoolean(body.usesAspirin),
    usesCorticosteroids: toBoolean(body.usesCorticosteroids),
    smoker: toBoolean(body.smoker),
    drinksAlcohol: toBoolean(body.drinksAlcohol),
    bloodPressure: toNullableString(body.bloodPressure),
    pregnantOrNursing: toBoolean(body.pregnantOrNursing),
    previousPregnancies: toBoolean(body.previousPregnancies),
    exercises: toBoolean(body.exercises),
    skinCareRoutine: toNullableString(body.skinCareRoutine),
    weightLoss: toNullableString(body.weightLoss),
    intendsToLoseWeight: toNullableString(body.intendsToLoseWeight),
    intendsSurgery: toNullableString(body.intendsSurgery),
    surgeries: toNullableString(body.surgeries),
    recentTreatmentOrVaccine: toNullableString(body.recentTreatmentOrVaccine),
    permanentImplants: toNullableString(body.permanentImplants),
    consentSigned: toBoolean(body.consentSigned),
    usesAnticoagulant: toBoolean(body.usesAnticoagulant),
    hasAutoimmuneDisease: toBoolean(body.hasAutoimmuneDisease),
    hasDiabetes: toBoolean(body.hasDiabetes),
    hasEpilepsy: toBoolean(body.hasEpilepsy),
    activeInfection: toBoolean(body.activeInfection),
    recentDentalProcedure: toBoolean(body.recentDentalProcedure),
    fillerComplicationHistory: toNullableString(body.fillerComplicationHistory),
    clinicalRiskNotes: toNullableString(body.clinicalRiskNotes),
  };
}

export function validatePatientPayload(body: PatientPayload) {
  const name = toRequiredString(body.name);

  if (name.length < 3) {
    return "Informe o nome completo da paciente com pelo menos 3 caracteres.";
  }

  return null;
}

export function patientErrorStatus(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return 400;
    if (error.code === "P2022") return 500;
  }

  return 500;
}

export function patientErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(", ") : String(error.meta?.target || "");
      if (target.includes("cpf")) return "Já existe uma paciente cadastrada com este CPF.";
      if (target.includes("email")) return "Já existe uma paciente cadastrada com este e-mail.";
      return "Já existe uma paciente cadastrada com esses dados.";
    }

    if (error.code === "P2022") {
      return "O banco de dados está desatualizado. Rode npx prisma migrate dev e npx prisma generate antes de tentar novamente.";
    }
  }

  return "Não foi possível salvar a paciente. Revise os dados e tente novamente.";
}

export function toAuditJson(value: unknown) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}
