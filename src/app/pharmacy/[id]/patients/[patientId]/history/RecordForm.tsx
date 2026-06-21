"use client";

import { useState, useEffect } from "react";
import { createClinicalRecord, signClinicalRecord, addAddendum } from "@/lib/actions/clinical";

export function RecordForm({ 
  historyId, 
  isDoctor, 
  recordId, 
  action 
}: { 
  historyId?: string, 
  isDoctor?: boolean, 
  recordId?: string, 
  action?: "SIGN" | "ADDENDUM" 
}) {
  const [loading, setLoading] = useState(false);

  // Estados para creación
  const [type, setType] = useState(isDoctor ? "MEDICAL_EVOLUTION" : "NURSING_NOTE");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [managementPlan, setManagementPlan] = useState("");
  const [cie10, setCie10] = useState("");
  const [cie10Results, setCie10Results] = useState<any[]>([]);
  const [cups, setCups] = useState("");
  const [cupsResults, setCupsResults] = useState<any[]>([]);

  useEffect(() => {
    if (cie10.length > 2) {
      fetch(`/api/dictionaries/cie10?q=${cie10}`)
        .then(r => r.json())
        .then(setCie10Results);
    } else {
      setCie10Results([]);
    }
  }, [cie10]);

  useEffect(() => {
    if (cups.length > 2) {
      fetch(`/api/dictionaries/cups?q=${cups}`)
        .then(r => r.json())
        .then(setCupsResults);
    } else {
      setCupsResults([]);
    }
  }, [cups]);

  // Estados para firma/aclaratoria
  const [pin, setPin] = useState("");
  const [content, setContent] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const diagnoses = cie10 ? [{ code: cie10.split(" ")[0], description: cie10, type: "PRINCIPAL" }] : [];
      await createClinicalRecord(historyId!, type, {
        anamnesis,
        physicalExam,
        managementPlan,
        diagnoses
      });
      setAnamnesis("");
      setPhysicalExam("");
      setManagementPlan("");
      setManagementPlan("");
      setCie10("");
      setCups("");
      alert("Registro guardado como BORRADOR. Recuerde firmarlo.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signClinicalRecord(recordId!, pin, "192.168.1.1"); // En prod: extraer IP real
      alert("Registro firmado exitosamente. Inmutabilidad aplicada.");
      setPin("");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  async function handleAddendum(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addAddendum(recordId!, content, pin, "192.168.1.1");
      alert("Nota aclaratoria guardada firmada.");
      setContent("");
      setPin("");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  if (action === "SIGN") {
    return (
      <form onSubmit={handleSign} style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
        <input 
          type="password" 
          placeholder="PIN de Firma (Ej: 1234)" 
          className="form-control" 
          style={{ width: "200px" }} 
          value={pin} onChange={e => setPin(e.target.value)} required 
        />
        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading ? "Firmando..." : "✅ Firmar Registro"}
        </button>
      </form>
    );
  }

  if (action === "ADDENDUM") {
    return (
      <form onSubmit={handleAddendum} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
        <textarea 
          placeholder="Escriba la nota aclaratoria..." 
          className="form-control" 
          rows={2} 
          value={content} onChange={e => setContent(e.target.value)} required 
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            type="password" 
            className="form-control" 
            placeholder="Código Google Authenticator o PIN" 
            style={{ width: "250px" }} 
            value={pin} onChange={e => setPin(e.target.value)} required 
          />
          <button type="submit" className="btn btn-warning" disabled={loading}>
            {loading ? "Guardando..." : "Agregar Aclaratoria"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label className="form-label">Tipo de Registro</label>
        <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
          {isDoctor && (
            <>
              <option value="MEDICAL_EVOLUTION">Evolución Médica</option>
              <option value="ADMISSION">Ingreso Clínico</option>
              <option value="DISCHARGE">Epicrisis / Egreso</option>
            </>
          )}
          <option value="NURSING_NOTE">Nota de Enfermería</option>
        </select>
      </div>

      <div>
        <label className="form-label">{isDoctor ? "Motivo de Consulta / Anamnesis" : "Observaciones / Nota"}</label>
        <textarea className="form-control" rows={4} value={anamnesis} onChange={e => setAnamnesis(e.target.value)} required />
      </div>

      <div>
        <label className="form-label">Examen Físico / Signos Vitales</label>
        <textarea className="form-control" rows={3} placeholder="TA: 120/80, FC: 80, FR: 18, Temp: 37°C" value={physicalExam} onChange={e => setPhysicalExam(e.target.value)} />
      </div>

      {/* Permitir CIE-10 y CUPS para médicos y enfermeras */}
          <div style={{ position: "relative" }}>
            <label className="form-label">Diagnóstico (CIE-10) Principal</label>
            <input type="text" className="form-control" placeholder="Ej: J019 Sinusitis aguda no especificada" value={cie10} onChange={e => setCie10(e.target.value)} />
            {cie10Results.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                {cie10Results.map(r => (
                  <div key={r.code} style={{ padding: "0.5rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onClick={() => { setCie10(`${r.code} ${r.description}`); setCie10Results([]); }}>
                    <strong>{r.code}</strong> - {r.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <label className="form-label">Procedimiento (CUPS)</label>
            <input type="text" className="form-control" placeholder="Buscar procedimiento CUPS..." value={cups} onChange={e => setCups(e.target.value)} />
            {cupsResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                {cupsResults.map(r => (
                  <div key={r.code} style={{ padding: "0.5rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onClick={() => { setCups(`${r.code} ${r.description}`); setCupsResults([]); }}>
                    <strong>{r.code}</strong> - {r.description}
                  </div>
                ))}
              </div>
            )}
          </div>

      {isDoctor && (
        <div>
          <label className="form-label">Plan de Manejo / Órdenes Médicas</label>
          <textarea className="form-control" rows={4} value={managementPlan} onChange={e => setManagementPlan(e.target.value)} />
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Guardando..." : "Guardar como Borrador"}
      </button>
    </form>
  );
}
