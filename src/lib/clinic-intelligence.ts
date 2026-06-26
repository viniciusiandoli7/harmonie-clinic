export type SafetyAlert = {
  level: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  recommendation?: string;
};

const hasText = (value?: string | null) => Boolean(String(value || "").trim());

export function buildSafetyAlerts(patient: any): SafetyAlert[] {
  const a = patient?.anamnesis || {};
  const alerts: SafetyAlert[] = [];

  if (a.pregnantOrNursing) alerts.push({ level: "CRITICAL", title: "Gestante ou amamentando", message: "Paciente informou gestação ou amamentação.", recommendation: "Avaliar contraindicações antes de qualquer procedimento injetável, laser ou peelings." });
  if (a.takingRoacutan) alerts.push({ level: "CRITICAL", title: "Uso de Roacutan", message: "Paciente informou uso de isotretinoína/Roacutan.", recommendation: "Reavaliar procedimentos abrasivos, peelings e microagulhamento conforme conduta clínica." });
  if (a.usesAnticoagulant || /anticoagul|aas|aspirina|varfarina|xarelto|rivaroxabana|eliquis|apixabana/i.test(a.medications || "")) alerts.push({ level: "WARNING", title: "Anticoagulante / AAS", message: "Há indicação de uso de anticoagulante, AAS ou medicamento que pode aumentar equimoses.", recommendation: "Registrar orientação, avaliar risco de sangramento e planejar técnica com cautela." });
  if (a.hasHerpes) alerts.push({ level: "WARNING", title: "Histórico de herpes", message: "Paciente possui histórico de herpes.", recommendation: "Avaliar profilaxia antes de procedimentos em lábios/perioral, laser, peelings ou microagulhamento." });
  if (a.allergies || a.allergicToEgg || a.allergicToSeafood) alerts.push({ level: "WARNING", title: "Alergias registradas", message: [a.allergies, a.allergicToEgg ? "alergia a ovo/albumina" : "", a.allergicToSeafood ? `frutos do mar: ${a.allergicToSeafood}` : ""].filter(Boolean).join(" • "), recommendation: "Conferir composição de produtos, anestésicos e histórico antes do procedimento." });
  if (a.keloidTendency) alerts.push({ level: "WARNING", title: "Tendência a queloide", message: "Paciente informou tendência a cicatriz ou queloide.", recommendation: "Cautela em procedimentos que causam injúria dérmica; registrar orientação." });
  if (a.hasAutoimmuneDisease || hasText(a.degenerativeDisease)) alerts.push({ level: "WARNING", title: "Doença autoimune/degenerativa", message: a.degenerativeDisease || "Paciente marcou doença autoimune.", recommendation: "Avaliar estabilidade do quadro e necessidade de liberação médica." });
  if (a.hasDiabetes) alerts.push({ level: "WARNING", title: "Diabetes", message: "Paciente informou diabetes.", recommendation: "Avaliar cicatrização, controle glicêmico e risco infeccioso." });
  if (a.activeInfection) alerts.push({ level: "CRITICAL", title: "Infecção ativa", message: "Paciente informou infecção ativa.", recommendation: "Adiar procedimentos eletivos até resolução clínica." });
  if (a.recentDentalProcedure) alerts.push({ level: "INFO", title: "Procedimento odontológico recente", message: "Paciente informou procedimento odontológico recente.", recommendation: "Avaliar tempo adequado antes de preenchimentos em face inferior/perioral." });
  if (hasText(a.previousFillers)) alerts.push({ level: "INFO", title: "Preenchimento anterior", message: a.previousFillers, recommendation: "Mapear produto, região e tempo antes de novo preenchimento." });
  if (hasText(a.fillerComplicationHistory) || hasText(a.procedureReaction)) alerts.push({ level: "WARNING", title: "Reação/intercorrência anterior", message: a.fillerComplicationHistory || a.procedureReaction, recommendation: "Registrar detalhes, fotos e conduta preventiva antes de novo procedimento." });
  if (hasText(patient?.notes)) alerts.push({ level: "INFO", title: "Observação crítica", message: patient.notes, recommendation: "Verificar antes de confirmar plano de tratamento." });

  return alerts;
}

export function buildWhatsAppLink(phone?: string | null, message?: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : digits ? `55${digits}` : "";
  return normalized
    ? `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message || "")}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message || "")}`;
}

export function applyTemplate(template: string, patient: any, extra: Record<string, string | number | null | undefined> = {}) {
  const replacements: Record<string, string> = {
    nome: patient?.name || "",
    primeiroNome: String(patient?.name || "").split(" ")[0] || "",
    procedimento: String(extra.procedimento || extra.procedure || "procedimento"),
    data: String(extra.data || ""),
    valor: String(extra.valor || ""),
    retorno: String(extra.retorno || ""),
  };
  return template.replace(/\[(nome|primeiroNome|procedimento|data|valor|retorno)\]/g, (_, key) => replacements[key] || "");
}
