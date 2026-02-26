export async function getPatients() {
  const res = await fetch("/api/patients")
  return res.json()
}

export async function createPatient(data: any) {
  const res = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  return res.json()
}
