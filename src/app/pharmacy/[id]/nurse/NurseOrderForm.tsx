"use client";

import { useState } from "react";

export function NurseOrderForm({ patients, products, action }: { 
  patients: any[]; 
  products: any[]; 
  action: (formData: FormData) => Promise<void>;
}) {
  const [items, setItems] = useState<Array<{ productId: string, qty: number, name: string, unit: string, controlled: boolean }>>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const needsDoctor = items.some(i => i.controlled);

  function addItem() {
    if (!selectedProduct || qty <= 0) return;
    setItems([...items, {
      productId: selectedProduct.id,
      qty,
      name: selectedProduct.name,
      unit: selectedProduct.unit,
      controlled: selectedProduct.controlled
    }]);
    setSelectedProductId("");
    setQty(1);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    await action(formData);
    setItems([]);
    const form = document.getElementById('nurseOrderForm') as HTMLFormElement;
    if (form) form.reset();
  }

  return (
    <form action={handleSubmit} id="nurseOrderForm">
      <input type="hidden" name="itemsJSON" value={JSON.stringify(items.map(i => ({ productId: i.productId, qty: i.qty })))} />

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Paciente *</label>
          <select name="patientId" required className="form-control">
            <option value="">Seleccionar paciente...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.bedNumber || "Sin cama"} {p.ward ? `(${p.ward})` : ""}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Nota clínica / Indicación</label>
          <input name="nurseNote" className="form-control" placeholder="Ej: PRN fiebre, post-quirúrgico..." />
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Añadir Medicamento:</div>
        <div className="form-grid" style={{ background: "var(--bg)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "0.5rem", alignItems: "flex-end" }}>
          <div className="form-group">
            <label className="form-label">Medicamento</label>
            <select className="form-control" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.concentration ? `${p.concentration}` : ""} — Stock: {p.stock} {p.unit} {p.controlled ? "⚠️(Controlado)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} className="form-control" />
          </div>
          <div className="form-group">
            <button type="button" className="btn btn-secondary" onClick={addItem} disabled={!selectedProductId}>
              + Añadir
            </button>
          </div>
        </div>

        {/* Lista de medicamentos añadidos */}
        {items.length > 0 && (
          <div className="table-wrap" style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Cantidad</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.controlled && <div className="text-xs text-danger">⚠️ Controlado</div>}
                    </td>
                    <td>{item.qty} {item.unit}</td>
                    <td>
                      <button type="button" onClick={() => removeItem(idx)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1.2rem" }}>
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {needsDoctor && (
          <div className="form-grid" style={{ background: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <div style={{ gridColumn: "1 / -1", color: "var(--danger)", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              ⚠️ Medicamentos de Control Especial añadidos - Requiere Fórmula
            </div>
            <div className="form-group">
              <label className="form-label">Médico Tratante *</label>
              <input name="doctorName" required className="form-control" placeholder="Nombre del médico" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Prescripción *</label>
              <input type="date" name="prescriptionDate" required className="form-control" />
            </div>
          </div>
        )}
      </div>

      <div className="form-actions" style={{ marginTop: "1.5rem" }}>
        <button type="submit" className="btn btn-primary" disabled={items.length === 0}>
          📤 Enviar Pedido a Farmacia ({items.length} meds)
        </button>
      </div>
    </form>
  );
}
