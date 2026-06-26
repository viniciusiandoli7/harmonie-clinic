import PatientForm from "../../../components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 md:px-8 xl:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#5A1F2B] font-semibold mb-2 font-sans">
            Mariana Thomaz Carmona
          </p>
          <h1
            className="text-[32px] leading-none text-[#1E1A18] tracking-[0.05em] mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}
          >
            Novo Paciente
          </h1>
          <p className="text-[13px] text-[#96A4C1] font-sans">
            Preencha os dados pessoais, anamnese e informações de origem e relacionamento.
          </p>
        </div>

        {/* Aqui o Super Cadastro é renderizado */}
        <PatientForm mode="create" />
      </div>
    </div>
  );
}