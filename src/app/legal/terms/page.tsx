export default function TermsPage() {
  return (
    <div style={{ lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Términos y Condiciones de Uso</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Última actualización: Junio de 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>1. Aceptación de los Términos</h2>
        <p>
          Al acceder o usar la plataforma <strong>StratosHealth</strong> (el "Servicio"), usted ("Usuario", "IPS", "Farmacia", "Proveedor") acepta estar vinculado legalmente por estos Términos y Condiciones. Si no está de acuerdo, no podrá acceder ni utilizar el Servicio.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>2. Descripción del Servicio</h2>
        <p>
          StratosHealth es una plataforma Software as a Service (SaaS) dirigida a Instituciones Prestadoras de Salud (IPS), Farmacias y Proveedores de medicamentos. La plataforma provee herramientas para:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>Gestión de Historias Clínicas Electrónicas.</li>
          <li>Control de inventario de medicamentos e insumos médicos (incluyendo reportes legales INVIMA).</li>
          <li>Conexión B2B para pedidos y órdenes de compra con proveedores.</li>
          <li>Facturación y generación técnica de RIPS.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>3. Obligaciones Legales del Usuario (Clínica/Farmacia)</h2>
        <p>El Usuario reconoce y acepta que es el único responsable legal frente a los entes de control (Ministerio de Salud, INVIMA, Secretarías de Salud, DIAN) de:</p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>La veracidad, precisión e integridad de la información clínica documentada en las Historias Clínicas.</li>
          <li>El resguardo del consentimiento informado físico o digital de sus pacientes.</li>
          <li>La dispensación correcta y el control de los Medicamentos de Control Especial (MCE).</li>
        </ul>
        <p>StratosHealth actúa como un proveedor tecnológico y <strong>NO asume responsabilidad por negligencia médica, dispensación errónea o evasión de reportes legales por parte del Usuario.</strong></p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>4. Inmutabilidad de Registros Clínicos</h2>
        <p>
          En cumplimiento con la <strong>Resolución 1995 de 1999</strong>, una vez firmado un registro o evolución clínica, <strong>este no podrá ser eliminado ni editado</strong> bajo ninguna circunstancia. Cualquier corrección técnica o médica deberá realizarse exclusivamente mediante el uso de "Notas Aclaratorias" o "Enmiendas", las cuales dejarán un registro inmutable de fecha, hora y autor.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>5. Suscripción, Facturación y Pagos</h2>
        <p>
          El uso de StratosHealth por parte de los Tenants (IPS/Farmacias/Proveedores) se rige por un modelo de suscripción (mensual o anual). La falta de pago resultará en la suspensión del acceso de escritura al sistema, garantizando únicamente el acceso de lectura (exportación) a las historias clínicas por el tiempo que exija la ley para garantizar los derechos de los pacientes.
        </p>
      </section>
    </div>
  );
}
