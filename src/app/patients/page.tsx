"use client";

import { useEffect, useState } from "react";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  async function loadPatients() {
    const res = await fetch("/api/patients");
    const data = await res.json();
    setPatients(data);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();

    await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm({ name: "", email: "", phone: "" });
    loadPatients();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Pacientes</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />
        <input
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />
        <button type="submit">Criar</button>
      </form>

      <hr />

      {patients.map((p: any) => (
        <div key={p.id}>
          {p.name} - {p.email}
        </div>
      ))}
    </div>
  );
}
