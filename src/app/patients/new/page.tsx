import PatientForm from "../../../components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-4 md:px-8 xl:px-12 xl:py-8">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#C5A059] font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Harmonie Management System
        </p>
        <h1
          className="text-[24px] leading-none text-[#1A1A1A] tracking-[0.14em] mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.14em', fontWeight: 700 }}
        >
          Novo paciente
        </h1>
        <p className="text-[12px] text-[#C5A059]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Cadastre um novo paciente com informações completas.
        </p>
      </div>

      <PatientForm mode="create" />
    </div>
  );
}