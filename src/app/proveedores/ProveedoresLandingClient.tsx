"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features: string;
}

export default function ProveedoresLandingClient({ plans }: { plans: Plan[] }) {
  // Estados interactivos
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [activeTab, setActiveTab] = useState<"catalog" | "coverage" | "orders">("catalog");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<Plan | null>(null);
  
  // Rotación del subtítulo (Typewriter/Carousel)
  const [subheadingIndex, setSubheadingIndex] = useState(0);
  const subheadings = ["Laboratorios Farmacéuticos", "Distribuidoras de Insumos", "Importadores de Equipamiento"];

  useEffect(() => {
    const timer = setInterval(() => {
      setSubheadingIndex((prev) => (prev + 1) % subheadings.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Estado del calculador de comisiones/ventas B2B
  const [clinicasAsociadas, setClinicasAsociadas] = useState(5);
  const [ticketPromedio, setTicketPromedio] = useState(1500000); // 1.5M COP

  // Estado para el asistente virtual / chat flotante
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { sender: "bot", text: "¡Hola! Bienvenido al canal de Proveedores de Stratos Health. ¿Te interesa vender tus insumos directamente a nuestra red de IPS?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleChatOption = (optionText: string, replyText: string) => {
    setChatMessages((prev) => [...prev, { sender: "user", text: optionText }]);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { sender: "bot", text: replyText }]);
    }, 1000);
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  // Cálculos del simulador financiero
  const facturacionEstimada = clinicasAsociadas * ticketPromedio;
  const comisionAhorrada = facturacionEstimada * 0.045; // 4.5% de ahorro frente a canales tradicionales

  return (
    <div className="farma-landing-light-amber" style={{
      minHeight: "100vh",
      background: "linear-gradient(-45deg, #fffbeb, #fafaf9, #fef3c7, #fdf6e2)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite",
      color: "#1c1917",
      fontFamily: "'Outfit', sans-serif",
      position: "relative",
      overflowX: "hidden"
    }}>
      {styleTag}

      {/* Header / Navbar */}
      <header className="glass-header-light" style={{
        padding: "1.25rem 5%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e7e5e4"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Logo size={42} variant="light" />
        </div>
        
        <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }} className="hidden md:flex">
          <a href="#features" className="nav-link-amber">Beneficios</a>
          <a href="#calculator" className="nav-link-amber">Simulador</a>
          <a href="#pricing" className="nav-link-amber">Planes B2B</a>
          <a href="#faqs" className="nav-link-amber">Ayuda</a>
        </nav>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/login" className="btn btn-outline-amber-theme">
            Portal B2B
          </Link>
          <Link href="#pricing" className="btn btn-primary-amber-theme">
            Registrar Marca
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "7.5rem 5% 6.5rem 5%",
        background: "radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(20, 184, 166, 0.05) 0%, transparent 50%)",
        position: "relative"
      }} className="dot-grid-amber">
        <div className="section-grid">
          <div>
            <div className="badge-premium-amber" style={{ marginBottom: "1.5rem" }}>
              🤝 DIRECTO A CLÍNICAS E IPS SIN INTERMEDIARIOS
            </div>
            
            <h1 style={{
              fontSize: "4.25rem",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              letterSpacing: "-1.5px",
              color: "#1c1917"
            }}>
              Canal de Distribución para <br />
              <span className="text-gradient-amber">
                {subheadings[subheadingIndex]}
              </span>
            </h1>
            
            <p style={{
              fontSize: "1.2rem",
              color: "#57534e",
              marginBottom: "2.5rem",
              lineHeight: 1.6,
              fontWeight: 400,
              maxWidth: "540px"
            }}>
              Únete a la central de compras médicas. Automatiza la recepción de órdenes de compra, optimiza tus tiempos de entrega y muestra tus ofertas INVIMA en tiempo real a las IPS compradoras de la red.
            </p>
            
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              <Link href="#pricing" className="btn btn-primary-amber-theme" style={{ fontSize: "1.1rem", padding: "1rem 2.25rem" }}>
                Ver Planes de Suscripción
              </Link>
              <a href="#calculator" className="btn btn-outline-amber-theme" style={{ fontSize: "1.1rem", padding: "1rem 2.25rem" }}>
                Calcular Retorno
              </a>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center" }} className="hero-img-animate">
            <div className="img-container-amber" style={{ width: "100%", maxWidth: "550px", height: "420px", position: "relative" }}>
              <img
                src="/images/supplier_logistics.png"
                alt="Distribución y Logística de Insumos Médicos"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "1.5rem",
                right: "1.5rem",
                background: "#ffffff",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e7e5e4",
                borderRadius: "20px",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <span style={{ fontSize: "2rem" }}>🚚</span>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "#1c1917", margin: 0 }}>Despachos Eficientes a Nivel Nacional</h4>
                  <p style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: 700, margin: "2px 0 0 0" }}>Control de Tiempos de Entrega (Lead-Times)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section style={{
        padding: "3.5rem 5%",
        background: "#fafaf9",
        borderTop: "1px solid #e7e5e4",
        borderBottom: "1px solid #e7e5e4"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "3rem",
          textAlign: "center"
        }}>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#d97706" }}>+20 IPS</h3>
            <p style={{ color: "#57534e", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Compradoras Activas</p>
          </div>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#0d9488" }}>100%</h3>
            <p style={{ color: "#57534e", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Cuentas por Cobrar al Día</p>
          </div>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#4f46e5" }}>0 intermediarios</h3>
            <p style={{ color: "#57534e", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Venta Corporativa Directa</p>
          </div>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#db2777" }}>&lt; 24h</h3>
            <p style={{ color: "#57534e", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Recepción de Órdenes</p>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section id="features" style={{ padding: "8rem 5% 5rem 5%" }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
          <div className="badge-premium-amber" style={{ marginBottom: "1.5rem" }}>
            🛠️ HERRAMIENTAS PARA PROVEEDORES
          </div>
          <h2 style={{ fontSize: "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1px", color: "#1c1917" }}>
            Control Total de tu Distribución B2B
          </h2>
          <p style={{ color: "#57534e", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Stratos Health pone a tu disposición un panel interactivo diseñado específicamente para optimizar las ventas y la logística farmacéutica.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "4rem",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`tab-btn-amber ${activeTab === "catalog" ? "active" : ""}`}
          >
            📂 Catálogo y Ofertas INVIMA
          </button>
          <button
            onClick={() => setActiveTab("coverage")}
            className={`tab-btn-amber ${activeTab === "coverage" ? "active" : ""}`}
          >
            🗺️ Cobertura por Departamento
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`tab-btn-amber ${activeTab === "orders" ? "active" : ""}`}
          >
            📝 Gestión de Pedidos Digitales
          </button>
        </div>

        {/* Tab Contents */}
        <div className="section-grid" style={{ minHeight: "450px" }}>
          {activeTab === "catalog" && (
            <>
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <span style={{ color: "#d97706", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>Control de Stock y Precios</span>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0.75rem 0 1.25rem 0", color: "#1c1917", letterSpacing: "-0.5px" }}>
                  Catálogo Digital Homologado en Tiempo Real
                </h3>
                <p style={{ color: "#57534e", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Publica tu portafolio de medicamentos e insumos médicos detallando nombre genérico, concentración, forma farmacéutica, número de registro sanitario INVIMA y lote.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="custom-bullet-amber">
                    <strong>Precios Autogestionables:</strong> Ajusta tus precios de venta en COP de forma inmediata y automática para las IPS.
                  </div>
                  <div className="custom-bullet-amber">
                    <strong>Cumplimiento INVIMA:</strong> Tus ofertas detallan lote y fecha de vencimiento, facilitando la recepción técnica a los regentes.
                  </div>
                  <div className="custom-bullet-amber">
                    <strong>Control de Inventario:</strong> Evita sobreventas configurando el stock disponible de forma centralizada.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                <div className="img-container-amber" style={{ width: "100%", maxWidth: "500px", height: "380px" }}>
                  <img
                    src="/images/pharmacy.png"
                    alt="Regente revisando inventario de medicamentos"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "#f59e0b",
                    color: "white",
                    padding: "0.4rem 1rem",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "0.8rem"
                  }}>
                    Catálogo Activo
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "coverage" && (
            <>
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <span style={{ color: "#0d9488", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>Logística Inteligente</span>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0.75rem 0 1.25rem 0", color: "#1c1917", letterSpacing: "-0.5px" }}>
                  Configuración de Zonas y Tiempos de Entrega
                </h3>
                <p style={{ color: "#57534e", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Delimita en qué departamentos de Colombia tienes capacidad operativa. Solo las clínicas con sedes en tus zonas de cobertura verán tus ofertas, ahorrando cancelaciones de pedidos.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="custom-bullet-amber bullet-teal-amber">
                    <strong>Lead-Times de Entrega:</strong> Asigna los días de tránsito estimados para que las clínicas puedan planificar sus existencias.
                  </div>
                  <div className="custom-bullet-amber bullet-teal-amber">
                    <strong>Segmentación Departamental:</strong> Selecciona Antioquia, Cundinamarca, Valle o cualquier departamento con un simple clic.
                  </div>
                  <div className="custom-bullet-amber bullet-teal-amber">
                    <strong>Cero Costos de Devolución:</strong> Sin pedidos incidentales fuera de tus rutas de envío autorizadas.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                <div className="img-container-amber" style={{ width: "100%", maxWidth: "500px", height: "380px" }}>
                  <img
                    src="/images/cover.png"
                    alt="Panel de cobertura geográfica en Colombia"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "#0d9488",
                    color: "white",
                    padding: "0.4rem 1rem",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "0.8rem"
                  }}>
                    Cobertura Geográfica
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "orders" && (
            <>
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <span style={{ color: "#4f46e5", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>Flujos de Trabajo Ágiles</span>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0.75rem 0 1.25rem 0", color: "#1c1917", letterSpacing: "-0.5px" }}>
                  Gestión y Aceptación de Pedidos en 1 Clic
                </h3>
                <p style={{ color: "#57534e", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Recibe las órdenes de compra (PO) de las clínicas directamente en tu panel de control, con el detalle completo de cantidades, precios pactados y datos de envío de la sede compradora.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="custom-bullet-amber bullet-indigo-amber">
                    <strong>Notificaciones Inmediatas:</strong> Alertas por correo y en plataforma cada vez que una clínica genera una orden de compra.
                  </div>
                  <div className="custom-bullet-amber bullet-indigo-amber">
                    <strong>Historial de Despachos:</strong> Mantén el registro de órdenes aceptadas, despachadas o canceladas para auditoría comercial.
                  </div>
                  <div className="custom-bullet-amber bullet-indigo-amber">
                    <strong>Integración Directa:</strong> Las facturas y remisiones se conectan con el kardex clínico del comprador al momento de la entrega.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                <div className="img-container-amber" style={{ width: "100%", maxWidth: "500px", height: "380px" }}>
                  <img
                    src="/images/doctors.png"
                    alt="Gestión comercial de pedidos con el cliente"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "#4f46e5",
                    color: "white",
                    padding: "0.4rem 1rem",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "0.8rem"
                  }}>
                    Pedidos B2B
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Interactive Return Calculator */}
      <section id="calculator" style={{
        padding: "8rem 5%",
        background: "transparent",
        borderTop: "1px solid #e7e5e4",
        borderBottom: "1px solid #e7e5e4"
      }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
          <div className="badge-premium-amber" style={{ marginBottom: "1.5rem" }}>
            📊 SIMULADOR FINANCIERO B2B
          </div>
          <h2 style={{ fontSize: "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1px", color: "#1c1917" }}>
            Proyección de Ventas en la Red Stratos
          </h2>
          <p style={{ color: "#57534e", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Estima tus volúmenes de comercialización mensuales basándote en la cantidad de clínicas que deseas abastecer y tu ticket de compra proyectado.
          </p>
        </div>

        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e7e5e4",
          borderRadius: "28px",
          padding: "2.5rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.02)"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem"
          }} className="grid-responsive-sim">
            
            {/* Controles de Entrada */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1c1917", borderBottom: "2px solid var(--primary-light)", paddingBottom: "0.5rem" }}>
                Variables de Venta
              </h4>

              {/* Slider 1: Clínicas */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontWeight: 700 }}>
                  <label>Número de Clínicas Abastecidas</label>
                  <span style={{ color: "#d97706" }}>{clinicasAsociadas} sedes</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  value={clinicasAsociadas} 
                  onChange={(e) => setClinicasAsociadas(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#f59e0b" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#78716c", marginTop: "4px" }}>
                  <span>1 sede</span>
                  <span>30 sedes</span>
                </div>
              </div>

              {/* Slider 2: Ticket Promedio */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontWeight: 700 }}>
                  <label>Compra Promedio Mensual por Sede</label>
                  <span style={{ color: "#d97706" }}>${ticketPromedio.toLocaleString("es-CO")} COP</span>
                </div>
                <input 
                  type="range" 
                  min="500000" 
                  max="10000000" 
                  step="500000"
                  value={ticketPromedio} 
                  onChange={(e) => setTicketPromedio(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#f59e0b" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#78716c", marginTop: "4px" }}>
                  <span>$500,000 COP</span>
                  <span>$10,000,000 COP</span>
                </div>
              </div>
            </div>

            {/* Resultados Financieros */}
            <div style={{
              background: "#fafaf9",
              borderRadius: "20px",
              border: "1px solid #e7e5e4",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "1.5rem"
            }}>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#78716c", textTransform: "uppercase" }}>Volumen de Negocio Mensual Proyectado</span>
                <div style={{ fontSize: "2.5rem", fontWeight: 950, color: "#d97706", marginTop: "0.25rem" }}>
                  ${facturacionEstimada.toLocaleString("es-CO")} COP
                </div>
                <span className="text-xs text-muted" style={{ fontSize: "0.8rem", color: "#78716c" }}>
                  Facturación bruta estimada por canal digital directo
                </span>
              </div>

              <div style={{ height: "1px", background: "#e7e5e4" }} />

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0d9488", textTransform: "uppercase" }}>Ahorro Estimado en Intermediación</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0d9488", marginTop: "0.25rem" }}>
                  ${comisionAhorrada.toLocaleString("es-CO")} COP / mes
                </div>
                <span className="text-xs text-muted" style={{ fontSize: "0.8rem", color: "#78716c" }}>
                  Al vender de manera directa y optimizar costos de fuerza comercial
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Planes Section */}
      <section id="pricing" style={{
        padding: "8rem 5% 7rem 5%",
        background: "transparent",
        borderBottom: "1px solid #e7e5e4",
        position: "relative"
      }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
          <div className="badge-premium-amber" style={{ marginBottom: "1.5rem" }}>
            💎 MEMBRESÍAS Y PLANES B2B
          </div>
          <h2 style={{
            fontSize: "3.25rem",
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: "-1px",
            marginBottom: "1.5rem",
            color: "#1c1917"
          }}>
            Planes de Suscripción de Proveedores
          </h2>
          <p style={{ color: "#57534e", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Elige el plan ideal según el volumen de ofertas que deseas publicar en el marketplace B2B de Stratos Health.
          </p>
          
          {/* Billing period switch */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "2.5rem"
          }}>
            <span style={{ fontWeight: 700, color: billingPeriod === "monthly" ? "#1c1917" : "#78716c" }}>Mensual</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              style={{
                width: "60px",
                height: "30px",
                borderRadius: "50px",
                background: "#f59e0b",
                border: "none",
                position: "relative",
                cursor: "pointer",
                padding: 0
              }}
            >
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: "4px",
                left: billingPeriod === "annual" ? "34px" : "4px",
                transition: "left 0.3s ease"
              }} />
            </button>
            <span style={{ fontWeight: 700, color: billingPeriod === "annual" ? "#1c1917" : "#78716c" }}>
              Anual <span style={{ color: "#0d9488", fontSize: "0.85rem" }}>(Ahorra 20%)</span>
            </span>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "2.5rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {plans.map((plan) => {
            const isAnnual = billingPeriod === "annual";
            // El precio de la base de datos ya es el precio mensual base
            const baseMonthlyPrice = plan.price;
            // Calcular precio a mostrar (mensual, con descuento si es anual)
            const displayedPrice = isAnnual 
              ? Math.round(baseMonthlyPrice * 0.8) 
              : Math.round(baseMonthlyPrice);

            return (
              <div key={plan.id} className={`card-plan-amber ${isAnnual ? "highlighted" : ""}`} style={{
                flex: "1 1 320px",
                maxWidth: "380px",
                padding: "2.5rem 2rem",
                display: "flex",
                flexDirection: "column"
              }}>
                {isAnnual && (
                  <div style={{
                    position: "absolute",
                    top: "-16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(90deg, #0d9488, #14b8a6)",
                    color: "white",
                    padding: "0.3rem 1.25rem",
                    borderRadius: "50px",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    letterSpacing: "1px",
                    boxShadow: "0 10px 20px rgba(13, 148, 136, 0.15)"
                  }}>
                    RECOMENDADO
                  </div>
                )}
                
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1c1917", marginBottom: "0.5rem" }}>
                  {plan.name}
                </h3>
                
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", margin: "1rem 0" }}>
                  <span style={{ fontSize: "2.75rem", fontWeight: 900, color: "#d97706", transition: "all 0.3s" }}>
                    ${displayedPrice.toLocaleString("es-CO")}
                  </span>
                  <span style={{ fontSize: "1.1rem", color: "#78716c", fontWeight: 500 }}>
                    / mes
                  </span>
                </div>
                
                <p style={{ color: "#57534e", fontSize: "0.95rem", marginBottom: "1.5rem", fontWeight: 500 }}>
                  Activa tu presencia comercial y vende de manera ágil a nivel regional.
                </p>
                
                <div style={{ height: "1px", background: "#e7e5e4", marginBottom: "2rem" }} />
                
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0 2.5rem 0" }}>
                  <span style={{ fontSize: "2.5rem" }}>📦</span>
                  {(() => {
                    try {
                      const parsed = JSON.parse(plan.features as string);
                      const featuresList = Array.isArray(parsed) ? parsed : [];
                      return (
                        <button 
                          type="button"
                          onClick={() => setSelectedPlanForModal(plan)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#d97706",
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                            textAlign: "center",
                            lineHeight: 1.4
                          }}
                        >
                          Ver las {featuresList.length} características comerciales
                        </button>
                      );
                    } catch (e) {
                      return (
                        <button 
                          type="button"
                          onClick={() => setSelectedPlanForModal(plan)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#d97706",
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0
                          }}
                        >
                          Ver características comerciales
                        </button>
                      );
                    }
                  })()}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "auto" }}>
                  <button 
                    type="button"
                    onClick={() => {
                      alert("Por favor ponte en contacto con la administración central de Stratos Health para validar tu NIT y activar tu cuenta de proveedor.");
                    }}
                    className="btn-primary-amber-theme" 
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "0.9rem",
                      fontSize: "1.05rem",
                      borderRadius: "50px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Habilitar Canal B2B
                  </button>
                </div>
              </div>
            );
          })}
          {plans.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px", border: "1px solid #e7e5e4", width: "100%", maxWidth: "600px" }}>
              <span style={{ fontSize: "2rem" }}>💼</span>
              <h4 style={{ fontWeight: 800, margin: "1rem 0 0.5rem 0" }}>Registro de Planes de Proveedores</h4>
              <p style={{ color: "#78716c", fontSize: "0.95rem" }}>
                El superadministrador del sistema se encuentra definiendo la grilla de tarifas comerciales. Por favor contáctanos para asignarte un plan piloto personalizado.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faqs" style={{
        padding: "5rem 5% 8rem 5%",
        background: "transparent"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 900, textAlign: "center", marginBottom: "3rem", letterSpacing: "-0.5px", color: "#1c1917" }}>
            Preguntas Frecuentes para Proveedores
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                q: "¿Cómo se asocian las órdenes de compra de las clínicas a mi panel?",
                a: "Cuando un regente de farmacia genera un pedido en la sección de abastecimiento B2B, el sistema valida que tu distribuidora posea cobertura en su departamento. Si cumple, la orden de compra aparece al instante en tu portal del proveedor en estado 'SENT' con las ofertas vigentes que hayas cargado."
              },
              {
                q: "¿Cómo configuro mis días estimados de entrega (lead-times)?",
                a: "Dentro de tu catálogo de ofertas, cada producto puede configurarse con un lead-time específico expresado en días hábiles. De esta manera, el regente sabe con exactitud cuándo llegará la mercancía y tú puedes gestionar tu logística sin presiones adicionales."
              },
              {
                q: "¿Qué sucede si mi suscripción comercial vence?",
                a: "Si el plan asignado cumple su fecha de pago y no se procesa la renovación automática, el sistema aplicará un bloqueo de acceso. Tus ofertas se ocultarán preventivamente del catálogo B2B de las clínicas aliadas hasta que se regularice la membresía con la administración de Stratos Health."
              }
            ].map((item, index) => {
              const isOpen = faqOpen === index;
              return (
                <div key={index} style={{
                  background: "#ffffff",
                  border: "1px solid #e7e5e4",
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.3s"
                }}>
                  <button
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "1.5rem",
                      textAlign: "left",
                      color: "#1c1917",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <span>{item.q}</span>
                    <span style={{ fontSize: "1.2rem", color: "#d97706", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▼
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: "0 1.5rem 1.5rem 1.5rem",
                      color: "#57534e",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      animation: "fadeIn 0.3s ease",
                      fontWeight: 500
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "4rem 5%",
        borderTop: "1px solid #e7e5e4",
        background: "#1c1917",
        color: "#a8a29e"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "2.5rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Logo size={36} variant="dark" />
            </div>
            <p style={{ fontSize: "0.9rem", maxWidth: "300px", lineHeight: 1.5 }}>
              Ecosistema B2B de Salud para Distribuidoras y Laboratorios. Canal directo con clínicas e IPS autorizadas.
            </p>
          </div>

          <div style={{ display: "flex", gap: "4rem" }}>
            <div>
              <h5 style={{ color: "white", fontWeight: 800, marginBottom: "1rem" }}>Ecosistema</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><Link href="/" style={{ color: "#a8a29e", textDecoration: "none" }}>Para IPS / Clínicas</Link></li>
                <li><Link href="/proveedores" style={{ color: "#a8a29e", textDecoration: "none" }}>Proveedores B2B</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 style={{ color: "white", fontWeight: 800, marginBottom: "1rem" }}>Accesos</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><Link href="/login" style={{ color: "#a8a29e", textDecoration: "none" }}>Portal B2B</Link></li>
                <li><Link href="#pricing" style={{ color: "#a8a29e", textDecoration: "none" }}>Planes de Suscripción</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: "1200px",
          margin: "2rem auto 0 auto",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          textAlign: "center",
          fontSize: "0.85rem"
        }}>
          <p>© {new Date().getFullYear()} Stratos Health. Todos los derechos reservados. Diseñado para optimizar el aprovisionamiento farmacéutico regulado en Colombia.</p>
        </div>
      </footer>

      {/* Floating Chat Assistant Widget */}
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9999
      }}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            style={{
              background: "#d97706",
              color: "white",
              border: "none",
              borderRadius: "50px",
              padding: "0.9rem 1.6rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              boxShadow: "0 10px 25px rgba(217, 119, 6, 0.3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "transform 0.3s"
            }}
            className="chat-trigger-amber"
          >
            <span style={{ fontSize: "1.25rem" }}>💬</span> Vender en Stratos
          </button>
        ) : (
          <div style={{
            width: "320px",
            background: "#ffffff",
            border: "1px solid #e7e5e4",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{
              background: "#d97706",
              padding: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "white"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800 }}>Asesor B2B Proveedores</h4>
                  <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>En línea • Responde al instante</span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{
              height: "220px",
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              background: "#fafaf9"
            }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === "bot" ? "flex-start" : "flex-end",
                    background: msg.sender === "bot" ? "#ffffff" : "#d97706",
                    border: msg.sender === "bot" ? "1px solid #e7e5e4" : "none",
                    color: msg.sender === "bot" ? "#1c1917" : "white",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "14px",
                    maxWidth: "85%",
                    fontSize: "0.85rem",
                    lineHeight: 1.4,
                    fontWeight: 500
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div style={{
                  alignSelf: "flex-start",
                  background: "#ffffff",
                  border: "1px solid #e7e5e4",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "14px",
                  fontSize: "0.8rem",
                  color: "#78716c"
                }}>
                  Escribiendo...
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div style={{
              padding: "0.75rem",
              background: "#ffffff",
              borderTop: "1px solid #e7e5e4",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem"
            }}>
              <span style={{ fontSize: "0.75rem", color: "#78716c", fontWeight: 700, paddingLeft: "0.25rem" }}>Preguntas sugeridas:</span>
              <button
                onClick={() => handleChatOption(
                  "¿Cómo me registro?",
                  "Para registrarte, el superadministrador debe crear tu cuenta de distribuidor. Por favor haz clic en 'Registrar Marca' y ponte en contacto con nosotros."
                )}
                className="chat-sugg-btn-amber"
              >
                📝 ¿Cómo me registro en el B2B?
              </button>
              <button
                onClick={() => handleChatOption(
                  "¿Tienen cobro de comisión?",
                  "No cobramos comisión por transacción. Solo pagas una membresía fija (mensual o anual) según el plan comercial que elijas."
                )}
                className="chat-sugg-btn-amber"
              >
                💵 ¿Cobran comisión de venta?
              </button>
              <button
                onClick={() => handleChatOption(
                  "Cobertura en regiones",
                  "Puedes configurar de forma flexible en qué departamentos de Colombia distribuyes tus productos para recibir órdenes calificadas."
                )}
                className="chat-sugg-btn-amber"
              >
                🗺️ Cobertura regional de envíos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Specs Modal */}
      {selectedPlanForModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(28, 25, 23, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          backdropFilter: "blur(8px)"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "550px",
            background: "#ffffff",
            borderRadius: "28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e7e5e4",
            overflow: "hidden",
            color: "#1c1917",
            animation: "fadeIn 0.3s ease",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.75rem 2rem",
              background: "#fafaf9",
              borderBottom: "1px solid #e7e5e4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Especificaciones Técnicas</span>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 900, color: "#1c1917" }}>Plan {selectedPlanForModal.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "2rem",
                  color: "#78716c",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 0
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "2rem", maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Plan Summary */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", background: "#fafaf9", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e7e5e4" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#78716c", fontWeight: 600 }}>Costo estimado</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706", marginTop: "2px" }}>
                    ${(billingPeriod === "annual" ? Math.round(selectedPlanForModal.price * 0.8) : Math.round(selectedPlanForModal.price)).toLocaleString("es-CO")}
                    <span style={{ fontSize: "0.9rem", color: "#78716c", fontWeight: 500 }}> / mes</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.85rem", color: "#78716c", fontWeight: 600 }}>Frecuencia</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1c1917", marginTop: "2px" }}>{selectedPlanForModal.durationMonths} {selectedPlanForModal.durationMonths === 1 ? "Mes" : "Meses"}</div>
                </div>
              </div>

              {/* Features Included */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1c1917", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Beneficios Incluidos</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedPlanForModal.features as string);
                      const featuresList = Array.isArray(parsed) ? parsed : [];
                      return featuresList.map((feature, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "#44403c", fontWeight: 500 }}>
                          <span style={{ color: "#0d9488", fontWeight: "bold" }}>✓</span>
                          <span>{feature}</span>
                        </li>
                      ));
                    } catch (e) {
                      return <li style={{ fontSize: "0.85rem", color: "#78716c" }}>Características estándar de la plataforma.</li>;
                    }
                  })()}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "1.25rem 2rem",
              background: "#fafaf9",
              borderTop: "1px solid #e7e5e4",
              display: "flex",
              gap: "1rem"
            }}>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                style={{
                  flex: 1,
                  padding: "0.8rem",
                  border: "1px solid #d6d3d1",
                  borderRadius: "50px",
                  background: "#ffffff",
                  color: "#57534e",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForModal(null);
                  alert("Por favor ponte en contacto con la administración central de Stratos Health para habilitar este plan en tu cuenta comercial.");
                }}
                style={{
                  flex: 1.5,
                  padding: "0.8rem",
                  border: "none",
                  borderRadius: "50px",
                  background: "#d97706",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  textAlign: "center"
                }}
              >
                Adquirir Membresía
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const styleTag = (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .dot-grid-amber {
      background-image: radial-gradient(rgba(120, 113, 108, 0.05) 1.5px, transparent 0);
      background-size: 24px 24px;
    }

    .nav-link-amber {
      color: #57534e;
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }
    .nav-link-amber:hover {
      color: #d97706;
    }

    .btn-primary-amber-theme {
      background: #d97706;
      color: white;
      border: none;
      font-weight: 700;
      border-radius: 50px;
      padding: 0.65rem 1.5rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(217, 119, 6, 0.2);
    }
    .btn-primary-amber-theme:hover {
      background: #b45309;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(217, 119, 6, 0.35);
    }

    .btn-outline-amber-theme {
      background: transparent;
      color: #d97706;
      border: 2px solid #d97706;
      font-weight: 700;
      border-radius: 50px;
      padding: 0.6rem 1.5rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
    }
    .btn-outline-amber-theme:hover {
      background: rgba(217, 119, 6, 0.05);
      transform: translateY(-2px);
    }

    .badge-premium-amber {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: #d97706;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
      border-radius: 50px;
      display: inline-block;
      letter-spacing: 0.5px;
    }

    .text-gradient-amber {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .img-container-amber {
      position: relative;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid #e7e5e4;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.04);
      transition: all 0.5s ease;
      background: #fafaf9;
    }
    .img-container-amber:hover {
      transform: scale(1.02);
      box-shadow: 0 30px 60px rgba(217, 119, 6, 0.15);
      border-color: rgba(217, 119, 6, 0.3);
    }

    .tab-btn-amber {
      background: #fafaf9;
      color: #57534e;
      border: 1px solid #e7e5e4;
      padding: 0.8rem 1.75rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tab-btn-amber:hover {
      background: #f5f5f4;
      color: #1c1917;
      transform: translateY(-2px);
    }
    .tab-btn-amber.active {
      background: #d97706;
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 15px rgba(217, 119, 6, 0.25);
    }

    .custom-bullet-amber {
      position: relative;
      padding-left: 2rem;
      margin-bottom: 1rem;
      color: #44403c;
      line-height: 1.5;
      font-weight: 500;
    }
    .custom-bullet-amber::before {
      content: "✓";
      position: absolute;
      left: 0;
      top: 0;
      color: #d97706;
      font-weight: 900;
      font-size: 1.15rem;
    }

    .bullet-teal-amber::before { color: #0d9488; }
    .bullet-indigo-amber::before { color: #4f46e5; }

    .card-plan-amber {
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 28px;
      padding: 3rem 2.25rem;
      transition: all 0.4s ease;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
    }
    .card-plan-amber:hover {
      transform: translateY(-10px);
      border-color: rgba(217, 119, 6, 0.3);
      box-shadow: 0 25px 50px rgba(217, 119, 6, 0.08);
    }
    .card-plan-amber.highlighted {
      border: 2px solid #d97706;
      box-shadow: 0 20px 45px rgba(217, 119, 6, 0.12);
    }

    .chat-sugg-btn-amber {
      background: #fafaf9;
      color: #57534e;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      font-weight: 700;
    }
    .chat-sugg-btn-amber:hover {
      background: rgba(217, 119, 6, 0.05);
      border-color: rgba(217, 119, 6, 0.3);
      color: #d97706;
    }

    .chat-trigger-amber:hover {
      transform: scale(1.05);
    }

    @keyframes floatImage {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    .hero-img-animate {
      animation: floatImage 6s ease-in-out infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 992px) {
      .section-grid {
        grid-template-columns: 1fr;
        gap: 3rem;
        text-align: center;
      }
      .custom-bullet-amber {
        padding-left: 0;
        display: inline-block;
        text-align: left;
        max-width: 500px;
        margin: 0 auto 1rem auto;
      }
      .custom-bullet-amber::before {
        display: none;
      }
    }
  `}} />
);
