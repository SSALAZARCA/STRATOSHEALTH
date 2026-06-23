import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function DictionariesSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (session?.user?.role !== "MANAGER" && session?.user?.role !== "SUPERADMIN") {
    return <div>Acceso denegado. Solo gerencia.</div>;
  }

  const cie10Count = await prisma.cie10.count();
  const cupsCount = await prisma.cups.count();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Diccionarios Clínicos Oficiales</h1>
        <p>Gestión de las bases de datos maestras requeridas para RIPS y Facturación Electrónica (Resolución 2275).</p>
      </div>

      <div className="grid-layout-2-equal">
        {/* CIE-10 Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">CIE-10 (Diagnósticos)</div>
          </div>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "3rem", margin: "0 0 1rem 0", color: cie10Count > 1000 ? "var(--success)" : "var(--warning)" }}>
              {cie10Count.toLocaleString()}
            </h2>
            <p className="text-muted">Códigos Cargados en Base de Datos</p>
            {cie10Count > 1000 ? (
              <div className="badge badge-success" style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>✅ Base de datos completa</div>
            ) : (
              <div className="alert alert-warning">Se requiere cargar el diccionario completo.</div>
            )}
          </div>
        </div>

        {/* CUPS Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">CUPS (Procedimientos)</div>
          </div>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "3rem", margin: "0 0 1rem 0", color: cupsCount > 1000 ? "var(--success)" : "var(--warning)" }}>
              {cupsCount.toLocaleString()}
            </h2>
            <p className="text-muted">Códigos Cargados en Base de Datos</p>
            
            <div style={{ marginTop: "1.5rem", padding: "1.5rem", background: "var(--bg)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
              <p style={{ fontSize: "0.875rem", marginBottom: "1rem", textAlign: "left" }}>
                Debido a la normativa de MinSalud, el catálogo CUPS debe ser cargado directamente desde el archivo oficial <strong>TablaReferencia_CUPSRips.csv</strong> descargado de SISPRO.
              </p>
              <form action="/api/dictionaries/upload-cups" method="POST" encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input type="file" name="file" accept=".csv" required className="form-control" />
                <button type="submit" className="btn btn-primary">Subir y Actualizar CUPS</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
