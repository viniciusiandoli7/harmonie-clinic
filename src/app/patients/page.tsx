"use client"

import { useEffect, useState } from "react"
import { getPatients } from "@/services/patientService"

export default function PatientsPage() {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    async function load() {
      const data = await getPatients()
      setPatients(data)
    }

    load()
  }, [])

  return (
    <div>
      <h1>Pacientes</h1>

      {patients.map((patient: any) => (
        <div key={patient.id}>
          {patient.name} - {patient.email}
        </div>
      ))}
    </div>
  )
}
