type EvolutionAiInput = {
  treatmentName: string;
  sessionNumber: number;
  patientName?: string | null;
  objective?: string | null;
};

export function generateEvolutionSuggestion(input: EvolutionAiInput) {
  const treatment = input.treatmentName || "tratamento estético";
  const session = input.sessionNumber || 1;
  const patient = input.patientName || "Paciente";
  const objective = input.objective || "melhora progressiva do quadro estético";

  return {
    performedProcedure: `${treatment} - sessão ${session}`,
    clinicalNotes: [
      `${patient} compareceu para realização da sessão ${session} de ${treatment}.`,
      `Procedimento realizado conforme planejamento terapêutico, com boa tolerância durante a sessão.`,
      `Paciente orientado(a) quanto aos cuidados pós-procedimento e acompanhamento da resposta clínica.`,
      `Objetivo clínico atual: ${objective}.`,
      `Sem intercorrências imediatas relevantes no momento do atendimento.`,
    ].join(" "),
    bodyMeasurements:
      "Preencher medidas atuais da paciente, evolução visual, queixas e resposta clínica observada.",
  };
}