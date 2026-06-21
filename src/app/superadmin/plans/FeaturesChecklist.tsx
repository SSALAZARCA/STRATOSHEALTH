"use client";

import { useState } from "react";

const STANDARD_FEATURES = [
  "Gestión de Inventario (Kardex)",
  "Historias Clínicas Protegidas",
  "Facturación y Cajas",
  "Control de Proveedores",
  "Módulo de Enfermería",
  "Reportes y Estadísticas",
  "Soporte Prioritario 24/7"
];

export function FeaturesChecklist({ defaultCheckedFeatures = [] }: { defaultCheckedFeatures?: string[] }) {
  // Combinar las características estándar con las que ya vienen guardadas pero no están en la lista estándar
  const initialFeatures = Array.from(new Set([...STANDARD_FEATURES, ...defaultCheckedFeatures]));
  
  const [features, setFeatures] = useState<string[]>(initialFeatures);
  const [newFeature, setNewFeature] = useState("");

  const addFeature = () => {
    const feat = newFeature.trim();
    if (feat && !features.includes(feat)) {
      setFeatures([...features, feat]);
      setNewFeature("");
    }
  };

  return (
    <div>
      <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Características Incluidas</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", maxHeight: "250px", overflowY: "auto" }}>
        {features.map((feat, idx) => {
          // Pre-marcar si estamos editando y estaba guardada, o si es un plan nuevo y es una de las 3 primeras estándar
          const isChecked = defaultCheckedFeatures.length > 0 
            ? defaultCheckedFeatures.includes(feat) 
            : idx < 3;

          return (
            <label key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
              <input 
                type="checkbox" 
                name="features" 
                value={feat} 
                defaultChecked={isChecked} 
                style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }} 
              />
              {feat}
            </label>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <input 
          type="text" 
          className="form-control" 
          style={{ flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.85rem" }} 
          placeholder="Añadir otra característica..." 
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFeature();
            }
          }}
        />
        <button 
          type="button" 
          className="btn btn-secondary btn-sm"
          onClick={addFeature}
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
