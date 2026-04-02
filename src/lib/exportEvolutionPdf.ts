import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportElementToPDF(elementOrId: string | HTMLElement, fileName: string) {
  // Verifica se recebeu um texto (ID) ou o elemento HTML direto
  const element = typeof elementOrId === "string" 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!element) {
    console.error("Elemento não encontrado para exportação.");
    alert("Erro: O conteúdo para o PDF não foi encontrado na tela.");
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Alta qualidade para leitura
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF"
    });

    const imgData = canvas.toDataURL("image/png");
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar o arquivo PDF.");
  }
}