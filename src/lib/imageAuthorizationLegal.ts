import { CONTRACTOR_INFO } from "./contractLegalCore";

export const IMAGE_AUTHORIZATION_TITLE = "TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM E VOZ";

export const IMAGE_CONTENT_OPTIONS = [
  { key: "photos", label: "Fotografias" },
  { key: "before_after", label: "Fotografias de antes e depois" },
  { key: "videos", label: "Vídeos" },
  { key: "identifiable_face", label: "Imagem com o rosto identificável" },
  { key: "non_identifiable", label: "Imagem sem exposição intencional da identidade/rosto" },
  { key: "voice_testimonial", label: "Voz e/ou depoimento" },
] as const;

export const IMAGE_CHANNEL_OPTIONS = [
  { key: "social_site", label: "Redes sociais e site" },
  { key: "educational_portfolio", label: "Materiais educativos, institucionais e portfólio profissional" },
  { key: "sponsored_ads", label: "Anúncios e campanhas publicitárias patrocinadas" },
] as const;

export const IMAGE_AUTHORIZATION_SECTIONS = [
  {
    title: "FINALIDADE DA AUTORIZAÇÃO",
    paragraphs: [
      "Autorizo a utilização da minha imagem e/ou voz para fins profissionais, educativos, informativos, institucionais e publicitários, incluindo divulgação de procedimentos, evolução de tratamentos, resultados, conteúdos de antes e depois, materiais educativos e apresentação do trabalho profissional.",
      "A utilização poderá ocorrer nos canais próprios ou utilizados profissionalmente pela autorizada, incluindo Instagram e demais redes sociais, site, plataformas digitais, anúncios e campanhas patrocinadas, materiais impressos ou digitais, apresentações, portfólio profissional e outros meios de comunicação relacionados às finalidades acima descritas.",
      "A presente autorização é independente do contrato de prestação de serviços e não constitui condição para realização de consulta, tratamento ou procedimento estético.",
      "A recusa em autorizar o uso da imagem e/ou voz não acarretará prejuízo, restrição ou alteração no atendimento da paciente.",
    ],
  },
  {
    title: "CONTEÚDO AUTORIZADO",
    paragraphs: [
      "A autorização poderá compreender, conforme os registros efetivamente realizados:",
      "Somente serão consideradas autorizadas as modalidades expressamente selecionadas no momento da assinatura.",
    ],
    type: "content-options" as const,
  },
  {
    title: "CANAIS DE DIVULGAÇÃO AUTORIZADOS",
    paragraphs: [
      "Autorizo a utilização do conteúdo selecionado acima em:",
      "Somente serão considerados autorizados os canais expressamente selecionados.",
    ],
    type: "channel-options" as const,
  },
  {
    title: "FORMA DE UTILIZAÇÃO",
    paragraphs: [
      "As fotografias e vídeos poderão ser selecionados, recortados, enquadrados, redimensionados, legendados e submetidos a ajustes técnicos necessários à adequação de formato, desde que tais alterações não sejam utilizadas para apresentar de maneira enganosa o resultado do tratamento ou para expor a paciente de forma ofensiva, vexatória ou incompatível com as finalidades desta autorização.",
      "Poderão ser utilizadas imagens realizadas antes, durante e após o tratamento, isoladamente ou em comparações de evolução e resultado.",
      "A autorização para divulgação de imagem não autoriza a divulgação indiscriminada de informações constantes do prontuário, anamnese ou histórico clínico da paciente.",
      "Dados como CPF, telefone, endereço, informações de saúde não necessárias à finalidade da publicação e demais dados pessoais não pertinentes ao conteúdo não deverão ser divulgados publicamente.",
      "Estou ciente de que, quando houver autorização para utilização de fotografias ou vídeos nos quais meu rosto, voz, características físicas ou outros elementos identificáveis estejam presentes, poderei ser reconhecido(a) por terceiros mesmo que meu nome não seja divulgado.",
    ],
  },
  {
    title: "PUBLICAÇÃO DE RESULTADOS",
    paragraphs: [
      "Estou ciente de que imagens de antes e depois representam a minha evolução individual e não significam promessa ou garantia de que outras pessoas obterão resultado igual ou semelhante.",
      "A utilização das imagens deverá preservar a correspondência com o registro realizado, não sendo autorizada alteração destinada a simular, ampliar ou falsificar o resultado estético efetivamente obtido.",
    ],
  },
  {
    title: "GRATUIDADE",
    paragraphs: [
      "Esta autorização é concedida a título gratuito, não gerando direito a cachê, remuneração, participação financeira, indenização pela utilização regularmente autorizada ou qualquer outra contraprestação pelo uso da imagem e/ou voz realizado dentro dos limites deste termo.",
      "A eventual valorização comercial, alcance, impulsionamento ou utilização publicitária do conteúdo regularmente autorizado não gera participação financeira da paciente, desde que respeitadas as finalidades e condições desta autorização.",
    ],
  },
  {
    title: "PRAZO E REVOGAÇÃO",
    paragraphs: [
      "A presente autorização permanecerá válida até que seja revogada pela paciente, sem prejuízo das demais hipóteses previstas na legislação aplicável.",
      `A paciente poderá solicitar a revogação da autorização para novas utilizações a qualquer momento pelos canais de atendimento da ${CONTRACTOR_INFO.companyName}.`,
      "Recebida a solicitação, a autorizada deverá registrar a revogação e interromper novas utilizações do conteúdo abrangido pela autorização revogada, bem como adotar, quando aplicável e tecnicamente possível, providências em relação aos conteúdos existentes nos canais diretamente sob seu controle.",
      "A revogação não transforma em irregular uma utilização que tenha sido realizada licitamente durante o período em que a autorização estava válida, sem prejuízo dos direitos assegurados à paciente pela legislação aplicável.",
      "Estou ciente de que conteúdos publicados na internet podem ter sido compartilhados, reproduzidos, capturados, armazenados ou republicados por terceiros, de forma independente e fora do controle da autorizada, não sendo possível garantir a exclusão de cópias mantidas por terceiros ou existentes em ambientes sobre os quais a autorizada não possua controle.",
    ],
  },
  {
    title: "REGISTROS CLÍNICOS E PRONTUÁRIO",
    paragraphs: [
      "Esta autorização refere-se especificamente à utilização e divulgação da imagem e/ou voz para as finalidades expressamente autorizadas neste documento.",
      "Fotografias, vídeos ou demais registros produzidos exclusivamente para documentação clínica, prontuário, planejamento, comparação de evolução, acompanhamento do tratamento, segurança da assistência e cumprimento de obrigações profissionais ou legais possuem finalidade distinta da autorização de divulgação pública prevista neste termo e serão tratados de acordo com as normas aplicáveis.",
      "A existência de registro fotográfico no prontuário não significa, por si só, autorização para sua publicação em redes sociais, anúncios ou outros materiais de divulgação.",
    ],
  },
  {
    title: "PROTEÇÃO E UTILIZAÇÃO DOS DADOS",
    paragraphs: [
      "Os registros abrangidos por esta autorização deverão ser utilizados e armazenados de forma compatível com as finalidades aqui estabelecidas, com adoção das medidas cabíveis de proteção e observância da legislação aplicável à proteção de dados pessoais.",
      "A autorização concedida neste documento não permite utilização da imagem, voz ou demais dados para finalidade substancialmente diferente daquelas aqui descritas sem nova base jurídica ou, quando necessário, nova autorização da paciente.",
    ],
  },
  {
    title: "DECLARAÇÃO FINAL",
    paragraphs: [
      "Declaro que:",
      "- li e compreendi integralmente este documento antes de assiná-lo;\n- tive oportunidade de esclarecer eventuais dúvidas;\n- compreendi quais tipos de conteúdo e canais de divulgação estou autorizando;\n- estou ciente da possibilidade de reconhecimento quando houver exposição de elementos identificáveis;\n- compreendo que a autorização é facultativa e independente da contratação dos serviços estéticos;\n- minha eventual recusa não prejudicará meu atendimento ou tratamento;\n- compreendo que a autorização é gratuita;\n- estou ciente da possibilidade de solicitar sua revogação para utilizações futuras;\n- autorizo exclusivamente as modalidades e canais expressamente selecionados neste documento.",
      `Dessa forma, AUTORIZO, de maneira livre, informada e expressa, a captação e utilização da minha imagem e/ou voz pela ${CONTRACTOR_INFO.companyName}, exclusivamente dentro dos limites, modalidades, canais e finalidades previstos neste termo.`,
      "Ao assinar eletronicamente este documento, declaro minha ciência, concordância e autorização nos termos acima.",
    ],
  },
] as const;

export function imageAuthorizationIntro(patientName?: string | null, cpf?: string | null) {
  return `Eu, ${patientName || "[NOME COMPLETO DO(A) PACIENTE]"}, inscrito(a) no CPF nº ${cpf || "[CPF]"}, declaro, de forma livre, informada, expressa e facultativa, que AUTORIZO a ${CONTRACTOR_INFO.companyName}, inscrita no CNPJ nº ${CONTRACTOR_INFO.cnpj}, bem como a profissional responsável ${CONTRACTOR_INFO.responsibleProfessional}, a captar, armazenar e utilizar minha imagem e/ou voz, por meio de fotografias, vídeos e demais registros audiovisuais, nos limites e para as finalidades descritas neste termo.`;
}

export function selectedLabels(keys: unknown, options: readonly { key: string; label: string }[]) {
  const selected = Array.isArray(keys) ? keys.map(String) : [];
  return options.filter((item) => selected.includes(item.key)).map((item) => item.label);
}
