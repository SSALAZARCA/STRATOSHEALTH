export default function PrivacyPolicyPage() {
  return (
    <div style={{ lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Política de Privacidad y Tratamiento de Datos</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Última actualización: Junio de 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>1. Identidad del Responsable</h2>
        <p>
          En cumplimiento estricto de la <strong>Ley 1581 de 2012</strong> (Habeas Data) y el Decreto Reglamentario 1377 de 2013 de la República de Colombia, 
          <strong> StratosHealth</strong> informa que actúa como responsable y/o encargado del tratamiento de datos personales y sensibles (como Historias Clínicas y datos de salud) recolectados a través de esta plataforma.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>2. Finalidad del Tratamiento</h2>
        <p>Los datos recolectados, incluidos datos sensibles de salud, serán utilizados con los siguientes fines:</p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>Creación, gestión y resguardo de la Historia Clínica Electrónica según la Resolución 1995 de 1999 y Resolución 839 de 2017.</li>
          <li>Gestión de facturación electrónica y generación de archivos RIPS (Resolución 510 de 2022).</li>
          <li>Control de inventario farmacéutico, trazabilidad y reporte de Medicamentos de Control Especial (MCE) ante el Fondo Nacional de Estupefacientes.</li>
          <li>Auditoría, control de calidad y seguridad del paciente.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>3. Tratamiento de Datos Sensibles</h2>
        <p>
          StratosHealth informa que, por ley, el titular no está obligado a autorizar el tratamiento de datos sensibles. No obstante, en el contexto de la prestación de servicios de salud, la omisión de dicha autorización imposibilita la creación de la Historia Clínica y, por ende, la prestación del servicio médico o farmacéutico correspondiente.
        </p>
        <p>El tratamiento de estos datos se rige bajo el principio de <strong>confidencialidad médica y secreto profesional</strong>.</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>4. Derechos de los Titulares</h2>
        <p>Como titular de sus datos personales, usted tiene derecho a:</p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>Conocer, actualizar y rectificar sus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la Ley 1581 de 2012.</li>
          <li>Revocar la autorización o solicitar la supresión del dato (salvo obligación legal o contractual que obligue a la conservación, como es el caso de las Historias Clínicas que deben guardarse por 15 años).</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>5. Seguridad de la Información</h2>
        <p>
          StratosHealth implementa medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros, evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento, utilizando protocolos de encriptación y logs de auditoría estrictos (Resolución 3100 de 2019).
        </p>
      </section>
    </div>
  );
}
