export default function CookiesPolicyPage() {
  return (
    <div style={{ lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Política de Cookies</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Última actualización: Junio de 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>1. ¿Qué son las Cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web que usted visita almacenan en su ordenador o dispositivo móvil. Son ampliamente utilizadas para que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información técnica a los propietarios del sitio.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>2. ¿Qué tipos de cookies usamos en StratosHealth?</h2>
        <p>En nuestra plataforma utilizamos exclusivamente cookies <strong>Esenciales / Técnicas</strong>. Debido a la naturaleza crítica de un sistema de salud e Historias Clínicas, NO utilizamos cookies de rastreo publicitario (Tracking/Marketing).</p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>
            <strong>Cookies de Sesión (Autenticación):</strong> Utilizadas por nuestro proveedor de autenticación para recordar que usted ha iniciado sesión de forma segura y evitar que tenga que ingresar sus credenciales en cada página.
          </li>
          <li>
            <strong>Cookies de Seguridad (CSRF):</strong> Para prevenir ataques de falsificación de peticiones entre sitios, protegiendo las acciones que usted realiza dentro de la historia clínica o facturación.
          </li>
          <li>
            <strong>Cookies de Preferencias UI:</strong> Para recordar preferencias simples del dispositivo local, como si ya cerró el banner de cookies o si prefiere modo oscuro.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>3. ¿Puedo deshabilitar las cookies?</h2>
        <p>
          Dado que StratosHealth es un software como servicio (SaaS) que requiere autenticación estricta para manejar datos médicos, <strong>no es posible deshabilitar las cookies esenciales</strong> y continuar usando la plataforma, ya que el sistema no podrá mantener su sesión de usuario activa y segura.
        </p>
        <p>
          Al usar la plataforma e iniciar sesión, usted acepta el uso de estas cookies técnicas imprescindibles.
        </p>
      </section>
    </div>
  );
}
