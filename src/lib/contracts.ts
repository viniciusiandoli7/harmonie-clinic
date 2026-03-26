type ContractItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
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

export function buildContractHtml(params: {
  patient: {
    name: string;
    email?: string | null;
    phone?: string | null;
    birthDate?: string | Date | null;
    cpf?: string | null;
    rg?: string | null;
  };
  clinic: {
    companyName: string;
    cnpj: string;
    address: string;
    email: string;
  };
  items: ContractItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethodLabel: string;
  paymentDetails?: string | null;
  contractDate?: string | Date | null;
}) {
  const itemsRows = params.items
    .map(
      (item, index) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${index + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${item.description}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${formatCurrency(item.total)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color:#1f3552; line-height:1.5;">
      <h2 style="text-align:center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>

      <p><strong>CONTRATANTE:</strong> ${params.patient.name} - ${
        params.patient.cpf ?? ""
      } - ${params.patient.rg ?? ""} - ${formatDate(params.patient.birthDate)} - ${
    params.patient.phone ?? ""
  }</p>

      <p><strong>CONTRATADA:</strong></p>
      <p>Nome: ${params.clinic.companyName}</p>
      <p>CNPJ: ${params.clinic.cnpj}</p>
      <p>Endereço: ${params.clinic.address}</p>
      <p>Email: ${params.clinic.email}</p>

      <hr />

      <p>
        As partes acima identificadas firmam o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS.
      </p>

      <p>
        Para execução do tratamento contratado, a CONTRATANTE adquire os seguintes itens:
      </p>

      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <thead>
          <tr>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">#</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">Produto / Serviço</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">Qtd.</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">Preço Unitário</th>
            <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin-top:20px;">
        <p><strong>SubTotal:</strong> ${formatCurrency(params.subtotal)}</p>
        <p><strong>Desconto:</strong> ${formatCurrency(params.discount)}</p>
        <p><strong>Total Geral:</strong> ${formatCurrency(params.total)}</p>
      </div>

      <div style="margin-top:20px;">
        <p><strong>Forma de Pagamento:</strong> ${params.paymentMethodLabel}</p>
        <p><strong>Detalhes:</strong> ${params.paymentDetails ?? "-"}</p>
      </div>

      <h3 style="margin-top:32px;">CLÁUSULAS GERAIS</h3>
      <p>1. O presente contrato tem por objeto a prestação de serviços estéticos pela CONTRATADA.</p>
      <p>2. A CONTRATADA se compromete a prestar os serviços com técnicas, equipamentos e métodos próprios.</p>
      <p>3. As sessões contratadas devem ser utilizadas dentro do prazo de vigência do contrato.</p>
      <p>4. As sessões somente se realizam mediante agendamento prévio.</p>
      <p>5. O não comparecimento poderá implicar perda da sessão, conforme política da clínica.</p>
      <p>6. O contrato é personalíssimo e intransferível.</p>

      <p style="margin-top:24px;">${formatDate(params.contractDate ?? new Date())}</p>

      <div style="margin-top:40px;">
        <p>Assinatura Contratada: __________________________</p>
        <p>Assinatura Contratante: _________________________</p>
      </div>
    </div>
  `.trim();
}