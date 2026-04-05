type ContractItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  observation?: string; 
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
}

const TREATMENT_TEXTS: Record<string, string> = {
  "ULTRASSOM MICRO E MACROFOCADO": `
    <b>Ultrassom micro e macrofocado:</b> O ultrassom micro e macrofocado é um procedimento estético não invasivo indicado para o tratamento da flacidez facial e corporal, melhora do contorno, estímulo profundo de colágeno e sustentação dos tecidos. Atua por meio de ondas de ultrassom focalizadas...<br/>
    <b>Indicações:</b> Flacidez facial leve a moderada, Flacidez corporal, Perda de contorno.<br/>
    <b>Contraindicações:</b> Gravidez, Dispositivos eletrônicos implantáveis, Infecção ativa.<br/>
    <b>Pós-procedimento:</b> Usar filtro solar FPS 50, Evitar calor excessivo por 24h, Não tomar Sol por 30 dias.
  `,
  "TOXINA BOTULÍNICA": `
    <b>Toxina botulínica:</b> Procedimento estético indicado para tratar as marcas provenientes das expressões faciais ou hiperidrose. A ideia é introduzir um princípio ativo que induza uma melhora da queixa estética.<br/>
    <b>Contraindicações:</b> Alergia ao ativo, Infecção no local, Gravidez, Glaucoma, Doenças autoimunes.<br/>
    <b>Pós-procedimento:</b> Evitar uso de cremes por 24h, não praticar atividade física no dia, não abaixar a cabeça por 4h.
  `,
  "SKINBOOSTER": `
    <b>Skinbooster:</b> Tratamento estético indicado à hidratação intensa e suavização de linhas de expressões, utilizando ácido hialurônico não reticulado e vitaminas.<br/>
    <b>Contraindicações:</b> Alergia ao ativo, Infecção sistêmica, Gravidez, Pacientes fazendo uso de laser/peeling intenso.<br/>
    <b>Pós-procedimento:</b> Retirar micropore em 1-2h. Não aplicar filtro solar nas primeiras 24h. Não tomar Sol por 10 dias.
  `,
  "PREENCHIMENTO": `
    <b>Preenchimento:</b> Procedimento estético indicado para recuperar volumização de determinadas regiões (ácido hialurônico).<br/>
    <b>Contraindicações:</b> Implantes permanentes (PMMA), Distúrbios da coagulação, Gravidez.<br/>
    <b>Pós-procedimento:</b> Não beijar ou morder lábios por 3 dias. Evitar anti-inflamatórios por 15 dias. Não colocar gelo.
  `,
  "PEIM": `
    <b>PEIM (Microvasos):</b> Procedimento estético injetável para microvasos, indicado à eliminação de telangiectasias (glicose 75%).<br/>
    <b>Contraindicações:</b> Insuficiência renal/cardíaca, Trombofilias, Gravidez.<br/>
    <b>Pós-procedimento:</b> Usar filtro solar nas pernas após 24h. Não realizar esforço físico por 24h. Não tomar Sol por 10 dias.
  `,
  "PEELING": `
    <b>Peeling:</b> Promove a renovação celular da pele por meio da aplicação de ácidos específicos.<br/>
    <b>Contraindicações:</b> Uso de Roacutan, Peles muito sensíveis, Tendência a queloides.<br/>
    <b>Pós-procedimento:</b> Não usar maquiagem por 48h. Não puxar a descamação da pele. Não tomar sol por 30 dias.
  `,
  "PDRN": `
    <b>PDRN:</b> Tratamento regenerativo para reparação tecidual, estímulo celular e melhora da qualidade da pele.<br/>
    <b>Contraindicações:</b> Implantes permanentes, Distúrbios de coagulação, Gravidez.<br/>
    <b>Pós-procedimento:</b> Evitar maquiagem por 24h, não massagear o local, evitar sol por 10 dias.
  `,
  "MICROAGULHAMENTO": `
    <b>Microagulhamento:</b> Estímulo de colágeno via drug delivery utilizando microagulhas.<br/>
    <b>Contraindicações:</b> Acne ativa, Propensão a queloide, Uso de isotretinoína nos últimos 6 meses.<br/>
    <b>Pós-procedimento:</b> Não aplicar filtro solar por 24h. Não usar maquiagem por 7 dias. Lavar local após 4h apenas com água fria.
  `,
  "MESOTERAPIA": `
    <b>Mesoterapia Capilar/Facial:</b> Utiliza uma mescla com potentes ativos injetados através de microagulhas.<br/>
    <b>Contraindicações:</b> Atopia respiratória (asma/bronquite), Tumores e câncer.<br/>
    <b>Pós-procedimento:</b> Evitar lavar o cabelo por 4h (se capilar). Não realizar atividade física no dia.
  `,
  "LIMPEZA DE PELE PROFUNDA": `
    <b>Limpeza de Pele Profunda:</b> Remoção de impurezas, células mortas, comedões e excesso de oleosidade.<br/>
    <b>Contraindicações:</b> Acne inflamatória grave, Dermatites, Uso recente de isotretinoína.<br/>
    <b>Pós-procedimento:</b> Evitar maquiagem por 24h, usar FPS 50+, evitar sauna e calor excessivo.
  `,
  "LAVIEEN": `
    <b>Laser Lavieen:</b> Tratamento a laser para estímulo de colágeno, controle de oleosidade e manchas.<br/>
    <b>Contraindicações:</b> Pele bronzeada, Acne ativa, Gravidez, Câncer de pele.<br/>
    <b>Pós-procedimento:</b> Não aplicar FPS por 24h. Não usar maquiagem por 7 dias. Não puxar casquinhas.
  `,
  "JATO DE PLASMA": `
    <b>Jato de Plasma:</b> Energia local para tratar flacidez, rugas, xantelasmas e remoção de sinais.<br/>
    <b>Contraindicações:</b> Propensão a queloide, Pele bronzeada, Uso de anticoagulantes.<br/>
    <b>Pós-procedimento:</b> Lavar apenas com água fria. Não arrancar crostas. Evitar Sol absoluto por 30 dias.
  `,
  "FIOS DE PDO BIOESTIMULADOR": `
    <b>Fios de PDO:</b> Tração dos tecidos e/ou bioestimulação de colágeno profunda.<br/>
    <b>Contraindicações:</b> Uso de vitamina E, ginko biloba, ômega 3 (aumenta sangramento).<br/>
    <b>Pós-procedimento:</b> Não realizar atividade física intensa. Não massagear. Evitar calor.
  `
};

export function buildContractHtml(params: {
  patient: { name: string; email?: string | null; phone?: string | null; birthDate?: string | Date | null; cpf?: string | null; rg?: string | null; };
  clinic: { companyName: string; cnpj: string; address: string; email: string; };
  items: ContractItem[];
  subtotal: number; discount: number; total: number;
  paymentMethodLabel: string; paymentDetails?: string | null; contractDate?: string | Date | null;
}) {
  
  const itemsRows = params.items.map((item, index) => `
    <tr>
      <td style="padding:8px; border:1px solid #ddd; text-align:center;">${index + 1}</td>
      <td style="padding:8px; border:1px solid #ddd;">${item.description} ${item.observation ? `<br/><small style="color: #555;">Obs: ${item.observation}</small>` : ''}</td>
      <td style="padding:8px; border:1px solid #ddd; text-align:center;">${item.quantity}</td>
      <td style="padding:8px; border:1px solid #ddd; text-align:right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:8px; border:1px solid #ddd; text-align:right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join("");

  const specificTreatmentsHtml = params.items.map(item => {
    const clauseText = TREATMENT_TEXTS[item.description.toUpperCase()];
    if (clauseText) {
      return `<div style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #C8A35F; font-size: 12px; line-height: 1.6; page-break-inside: avoid;">
                ${clauseText}
              </div>`;
    }
    return '';
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; color:#111; line-height:1.5; font-size: 14px; padding: 10px;">
      <h2 style="text-align:center; color:#111;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS</h2>

      <div style="margin-bottom: 20px;">
        <p><strong>CONTRATANTE:</strong> ${params.patient.name} - CPF: ${params.patient.cpf ?? "Não informado"} - RG: ${params.patient.rg ?? "Não informado"} - Nasc: ${formatDate(params.patient.birthDate)} - Tel: ${params.patient.phone ?? "Não informado"}</p>

        <p><strong>CONTRATADA:</strong><br/>
        Nome: ${params.clinic.companyName}<br/>
        CNPJ: ${params.clinic.cnpj}<br/>
        Endereço: ${params.clinic.address}<br/>
        Email: ${params.clinic.email}</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />

      <p>As partes acima identificadas firmam o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS.</p>
      <p>Para execução do tratamento contratado, a CONTRATANTE adquire os seguintes itens:</p>

      <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f1f1f1;">
            <th style="padding:8px; border:1px solid #ddd; text-align:center; width: 5%;">#</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:left; width: 40%;">Produto / Serviço</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:center; width: 10%;">Qtd.</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right; width: 20%;">Vlr. Unitário</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right; width: 25%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin-top:20px; font-size: 13px; text-align: right;">
        <p style="margin: 4px 0;"><strong>SubTotal:</strong> ${formatCurrency(params.subtotal)}</p>
        <p style="margin: 4px 0;"><strong>Desconto:</strong> ${formatCurrency(params.discount)}</p>
        <p style="margin: 4px 0; font-size: 15px;"><strong>Total a Pagar:</strong> ${formatCurrency(params.total)}</p>
      </div>

      <div style="margin-top:20px; font-size: 13px; background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd;">
        <p style="margin: 0 0 5px 0;"><strong>Forma de Pagamento:</strong> ${params.paymentMethodLabel}</p>
        <p style="margin: 0;"><strong>Detalhes:</strong> Pagamento processado na data de fechamento.</p>
      </div>

      <div style="page-break-inside: avoid;">
        <h3 style="margin-top:32px;">CLÁUSULAS GERAIS</h3>
        <div style="font-size: 12px; line-height: 1.6; text-align: justify;">
          <p>1. O presente contrato tem por objeto a prestação de serviços estéticos pela CONTRATADA, incluindo os tratamentos descritos neste documento.</p>
          <p>2. A CONTRATANTE declara estar ciente de que todas as sessões contratadas devem ser utilizadas dentro do prazo de vigência deste contrato, que é de 3 (três) meses.</p>
          <p>3. As sessões somente se realizam mediante agendamento prévio. O atraso ou não comparecimento poderá implicar na perda da sessão.</p>
          <p>4. A simples insatisfação com os serviços não ensejará devolução dos valores pagos.</p>
          <p>5. Em caso de desistência ou interrupção do tratamento, haverá cobrança de despesas administrativas fixadas em 15% sobre o valor do contrato, além das sessões já realizadas.</p>
          <p>6. A CONTRATANTE declara ter preenchido integralmente a ficha de anamnese e que as informações são verdadeiras.</p>
        </div>
      </div>

      <h3 style="margin-top:32px;">ESPECIFICAÇÕES DOS PROCEDIMENTOS</h3>
      <p style="font-size: 12px; color: #333;">O paciente declara estar ciente das indicações, contraindicações e cuidados pós-procedimento descritos abaixo para cada serviço adquirido:</p>
      
      ${specificTreatmentsHtml}

      <div style="page-break-inside: avoid;">
        <p style="margin-top:40px; text-align: center; font-style: italic;">São Paulo, ${formatDate(params.contractDate ?? new Date())}</p>

        <table style="width: 100%; margin-top: 60px; text-align: center; border: none;">
          <tr>
            <td style="width: 45%; padding: 0 10px; border: none;">
              <hr style="border: 0; border-top: 1px solid #111; margin-bottom: 5px;" />
              <p style="font-size: 12px; margin: 0;">${params.clinic.companyName}<br/>Contratada</p>
            </td>
            <td style="width: 10%; border: none;"></td>
            <td style="width: 45%; padding: 0 10px; border: none;">
              <hr style="border: 0; border-top: 1px solid #111; margin-bottom: 5px;" />
              <p style="font-size: 12px; margin: 0;">${params.patient.name}<br/>Contratante</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `.trim();
}