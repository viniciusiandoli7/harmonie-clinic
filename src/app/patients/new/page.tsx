import PatientForm from "../../../components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 md:px-8 xl:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C5A059] font-semibold mb-2 font-sans">
            Harmonie Clinic
          </p>
          <h1
            className="text-[32px] leading-none text-[#1A1A1A] tracking-[0.05em] mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}
          >
            Novo Paciente
          </h1>
          <p className="text-[13px] text-[#96A4C1] font-sans">
            Preencha os dados pessoais, anamnese e informações de marketing.
          </p>
        </div>

        {/* Aqui o Super Cadastro é renderizado */}
        <PatientForm mode="create" />
      </div>
    </div>
  );
}