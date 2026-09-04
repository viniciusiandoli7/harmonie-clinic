export const CONTRACTOR_INFO = {
  companyName: "THOMAZ & CARMONA LTDA.",
  cnpj: "57.007.483/0001-73",
  responsibleProfessional: "Mariana Thomaz Carmona – Biomédica Esteta – CRBM 61873",
  professionalName: "Mariana Thomaz Carmona",
  professionalCredential: "Biomédica Esteta – CRBM 61873",
  address: "Rua Itapeva, 518 – conjunto 1507 – Bela Vista",
  email: "marianacarmona447@gmail.com",
} as const;

export type GeneralContractClause = {
  number: number;
  title: string;
  paragraphs: string[];
};

export const GENERAL_CONTRACT_CLAUSES: GeneralContractClause[] = [
  {
    number: 1,
    title: "OBJETO",
    paragraphs: [
      "O presente contrato tem por objeto a prestação dos serviços estéticos discriminados no quadro “Procedimentos Contratados”, nas respectivas quantidades, regiões, valores e observações registradas.",
      "Somente serão considerados incluídos os procedimentos, quantidades, regiões, sessões, produtos, benefícios e eventuais retoques expressamente registrados neste documento ou no sistema da CONTRATADA.",
      "Serviços ou quantidades adicionais dependerão de nova indicação e, quando aplicável, nova contratação.",
    ],
  },
  {
    number: 2,
    title: "VALOR E PAGAMENTO",
    paragraphs: [
      "A CONTRATANTE declara ciência do valor total da contratação, dos descontos eventualmente concedidos e da forma de pagamento registrados neste documento.",
      "Quando houver parcelamento, as parcelas representam forma de pagamento do valor total contratado, não correspondendo à aquisição mensal ou independente de cada procedimento ou sessão.",
      "A interrupção do tratamento não implica, por si só, cancelamento automático das parcelas assumidas, devendo eventual apuração financeira observar este contrato e a legislação aplicável.",
    ],
  },
  {
    number: 3,
    title: "PRAZO PARA UTILIZAÇÃO",
    paragraphs: [
      "Os procedimentos e sessões contratados deverão ser utilizados no prazo máximo de 12 (doze) meses contados da data da contratação, respeitando-se os intervalos e critérios técnicos de cada tratamento.",
      "É responsabilidade da CONTRATANTE solicitar seus agendamentos com antecedência suficiente para utilização dos serviços dentro desse período.",
      "O prazo de 12 meses não obriga a profissional a realizar procedimentos em intervalos considerados tecnicamente inadequados.",
      "Após o término do prazo, eventual utilização de serviços não realizados dependerá de nova avaliação e das condições comerciais vigentes, observada a legislação aplicável.",
    ],
  },
  {
    number: 4,
    title: "AGENDAMENTO, CANCELAMENTO, FALTAS E ATRASOS",
    paragraphs: [
      "Os atendimentos serão realizados mediante agendamento prévio.",
      "Cancelamentos ou pedidos de remarcação deverão ser comunicados com antecedência mínima de 24 (vinte e quatro) horas.",
      "O não comparecimento ou cancelamento fora desse prazo poderá implicar perda da reserva ou da sessão agendada, quando previamente informado, ressalvadas situações excepcionais justificadas e observada a legislação aplicável.",
      "Atrasos poderão reduzir o período disponível para atendimento. Caso o atraso comprometa a realização adequada ou segura do procedimento, poderá ser necessário reagendamento.",
    ],
  },
  {
    number: 5,
    title: "DESISTÊNCIA ANTES DO INÍCIO DO TRATAMENTO",
    paragraphs: [
      "Caso a CONTRATANTE solicite o cancelamento antes da realização do primeiro procedimento ou sessão, eventual restituição será apurada considerando os valores efetivamente pagos, despesas comprovadamente incorridas e produtos eventualmente adquiridos ou individualizados especificamente para o tratamento, respeitada a legislação aplicável.",
      "Esta disposição não afasta eventual direito legal aplicável à forma específica pela qual a contratação tenha sido realizada.",
    ],
  },
  {
    number: 6,
    title: "DESISTÊNCIA APÓS O INÍCIO DO TRATAMENTO",
    paragraphs: [
      "Considera-se iniciado o tratamento a partir da realização do primeiro procedimento ou sessão integrante da contratação.",
      "Após iniciado o tratamento, a simples desistência, mudança de vontade, arrependimento pessoal, decisão de não continuar ou insatisfação exclusivamente subjetiva não gera, por si só, direito à devolução integral dos valores pagos nem ao cancelamento automático das parcelas contratadas.",
      "Havendo solicitação de encerramento após o início, eventual apuração financeira considerará os procedimentos já realizados, produtos utilizados ou individualizados, descontos concedidos em razão da contratação conjunta, custos diretamente relacionados à execução e demais valores legitimamente devidos, observada a legislação aplicável.",
    ],
  },
  {
    number: 7,
    title: "PACOTES, DESCONTOS E CONDIÇÕES ESPECIAIS",
    paragraphs: [
      "Quando a contratação conjunta de procedimentos ou sessões resultar em desconto, valor promocional ou condição especial, o benefício estará vinculado à contratação realizada como um todo.",
      "Em caso de encerramento antecipado solicitado pela CONTRATANTE, eventual saldo poderá ser apurado considerando os procedimentos efetivamente realizados pelos respectivos valores individuais previamente informados, inclusive quanto à perda proporcional do benefício concedido pela contratação conjunta, respeitada a legislação aplicável.",
    ],
  },
  {
    number: 8,
    title: "RESULTADOS E PLANEJAMENTO",
    paragraphs: [
      "A CONTRATANTE declara ciência de que procedimentos estéticos estão sujeitos à resposta individual do organismo, não havendo promessa ou garantia de resultado estético específico.",
      "O planejamento poderá ser ajustado conforme evolução, resposta individual, condições clínicas e avaliação profissional.",
      "A profissional responsável poderá recusar ou interromper procedimento que considere inadequado ou inseguro.",
      "Insatisfação exclusivamente relacionada à expectativa subjetiva, quando o serviço tiver sido adequadamente prestado, não implica automaticamente direito a devolução, indenização, nova aplicação ou procedimento adicional gratuito.",
    ],
  },
  {
    number: 9,
    title: "RETORNO, RETOQUE E PROCEDIMENTOS ADICIONAIS",
    paragraphs: [
      "Retorno para avaliação não significa automaticamente direito a retoque, nova sessão, produto adicional ou procedimento gratuito.",
      "Somente serão considerados incluídos retoques, procedimentos adicionais ou benefícios expressamente registrados na contratação ou no respectivo termo específico.",
      "Quando houver retoque incluso, deverão ser respeitados o prazo, a indicação profissional e as condições específicas do procedimento.",
      "Procedimentos ou quantidades adicionais não previstos na contratação original poderão ser cobrados separadamente.",
    ],
  },
  {
    number: 10,
    title: "INFORMAÇÕES E RESPONSABILIDADES DA CONTRATANTE",
    paragraphs: [
      "A CONTRATANTE declara que as informações fornecidas na anamnese e durante os atendimentos são verdadeiras, completas e atualizadas, comprometendo-se a informar alterações de saúde, medicamentos, alergias, gravidez ou amamentação, procedimentos anteriores e demais condições relevantes.",
      "Compromete-se também a seguir as orientações fornecidas e comunicar prontamente qualquer intercorrência ou alteração relevante durante o tratamento.",
      "A CONTRATANTE deverá informar a realização de procedimentos por outros profissionais que possam interferir na região tratada, na segurança ou nos resultados.",
      "Consequências comprovadamente decorrentes exclusivamente de omissão de informação relevante, procedimento realizado por terceiro, automedicação ou descumprimento das orientações serão analisadas conforme sua relação com o evento ocorrido, sem afastar responsabilidades legalmente atribuíveis à CONTRATADA.",
    ],
  },
  {
    number: 11,
    title: "TERMOS ESPECÍFICOS",
    paragraphs: [
      "Cada procedimento poderá possuir termo específico contendo suas indicações, contraindicações, possíveis riscos, efeitos, cuidados e orientações pré e pós-procedimento.",
      "Os termos correspondentes aos procedimentos contratados e/ou realizados integram a documentação do atendimento e complementam este contrato.",
      "A CONTRATANTE compromete-se a observar as orientações específicas recebidas.",
    ],
  },
  {
    number: 12,
    title: "DADOS, PRONTUÁRIO E IMAGENS CLÍNICAS",
    paragraphs: [
      "Os dados pessoais, informações de saúde, documentos e imagens clínicas necessárias ao prontuário poderão ser tratados e armazenados para execução e acompanhamento dos serviços e cumprimento das obrigações legais e profissionais aplicáveis.",
      "O registro de imagens para finalidade clínica não constitui autorização para divulgação pública.",
      "A utilização de imagem para publicidade, redes sociais ou divulgação dependerá de autorização específica da CONTRATANTE, quando aplicável.",
    ],
  },
  {
    number: 13,
    title: "DISPOSIÇÕES FINAIS",
    paragraphs: [
      "Integram a presente contratação todas as páginas deste documento, incluindo os procedimentos, quantidades, valores, descontos e observações registrados, bem como os respectivos termos específicos anexados.",
      "Nenhuma disposição deste contrato deverá ser interpretada como exclusão de direito ou responsabilidade que não possa ser afastado pela legislação aplicável.",
      "Eventuais divergências deverão, sempre que possível, ser inicialmente tratadas entre as partes para tentativa de solução consensual, sem prejuízo dos direitos legalmente assegurados.",
    ],
  },
];

export const CONTRACT_ACCEPTANCE_TEXT =
  "Ao assinar eletronicamente este documento, a CONTRATANTE declara que teve oportunidade de realizar sua leitura e esclarecer eventuais dúvidas, estando ciente e de acordo com a integralidade do documento e de todas as páginas que o compõem, incluindo os procedimentos contratados, quantidades, observações, valores, condições de pagamento, cláusulas gerais e termos específicos anexados.";

export function formatContractNumber(token?: string | null, contractDate?: string | Date | null) {
  const date = contractDate ? new Date(contractDate) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const y = safeDate.getFullYear();
  const m = String(safeDate.getMonth() + 1).padStart(2, "0");
  const d = String(safeDate.getDate()).padStart(2, "0");
  const tokenSuffix = String(token || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(-32);
  const fallback = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TC-${y}${m}${d}-${tokenSuffix || fallback}`;
}

export function getContractUseByDate(value?: string | Date | null) {
  const source = value ? new Date(value) : new Date();
  const date = Number.isNaN(source.getTime()) ? new Date() : new Date(source.getTime());
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 12);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return date;
}
