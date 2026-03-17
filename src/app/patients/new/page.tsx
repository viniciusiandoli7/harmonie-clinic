import PatientForm from "../../../components/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo paciente</h1>
        <p className="text-gray-500">
          Cadastre um novo paciente com informações completas.
        </p>
      </div>

      <PatientForm mode="create" />
    </div>
  );
}