"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  maxUsers: number;
  features: string;
}

export default function LandingClient({ plans }: { plans: Plan[] }) {
  // Estados interactivos
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly"); // kept for compat, not shown in landing
  const [activeTab, setActiveTab] = useState<"ips" | "farmacia" | "b2b">("ips");
  const [activeRole, setActiveRole] = useState<"regente" | "gerente">("regente");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<Plan | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Rotación del subtítulo (Typewriter/Carousel)
  const [subheadingIndex, setSubheadingIndex] = useState(0);
  const subheadings = ["Clínicas e IPS", "Farmacias y Regentes", "Proveedores B2B"];

  useEffect(() => {
    const timer = setInterval(() => {
      setSubheadingIndex((prev) => (prev + 1) % subheadings.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Estado para el simulador de farmacia
  const [simulatedStock, setSimulatedStock] = useState(100);
  const [simulatedLogs, setSimulatedLogs] = useState<Array<{ id: number; type: string; qty: number; balance: number; user: string }>>([
    { id: 1, type: "ENTRADA (Compra B2B)", qty: 100, balance: 100, user: "Regente de Farmacia" }
  ]);

  const handleSimulateDispatch = () => {
    if (activeRole === "gerente") return;
    if (simulatedStock < 20) {
      alert("¡Alerta INVIMA: Stock insuficiente para despachar!");
      return;
    }
    const nextStock = simulatedStock - 20;
    setSimulatedStock(nextStock);
    setSimulatedLogs([
      {
        id: Date.now(),
        type: "SALIDA (Despacho Enfermería)",
        qty: 20,
        balance: nextStock,
        user: "Regente de Farmacia"
      },
      ...simulatedLogs
    ]);
  };

  // Estado para el asistente virtual / chat flotante
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { sender: "bot", text: "¡Hola! Bienvenido a Stratos Health. ¿Cómo puedo ayudarte hoy?" }
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

  return (
    <div className="farma-landing-light" style={{
      minHeight: "100vh",
      background: "linear-gradient(-45deg, #f0f7ff, #f8fafc, #e0f2fe, #eff6ff)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite",
      color: "#1e293b",
      fontFamily: "'Outfit', sans-serif",
      position: "relative",
      overflowX: "hidden"
    }}>
      {styleTag}

      {/* Barra de aviso para proveedores - top of page */}
      <div style={{
        background: "linear-gradient(90deg, #064e3b, #065f46)",
        color: "white",
        textAlign: "center",
        padding: "0.6rem 5%",
        fontSize: "0.875rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem"
      }}>
        <span>🏭 ¿Eres proveedor o distribuidor farmacéutico?</span>
        <Link
          href="/proveedores"
          style={{
            color: "#6ee7b7",
            fontWeight: 800,
            textDecoration: "underline",
            whiteSpace: "nowrap"
          }}
        >
          Ingresa al Portal de Proveedores →
        </Link>
      </div>

      {/* Header / Navbar */}
      <header className="glass-header-light" style={{
        padding: isMobile ? "0.75rem 3%" : "1.25rem 5%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Logo size={isMobile ? 32 : 42} variant="light" showText={!isMobile} />
        </div>
        
        {!isMobile && (
          <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <a href="#features" className="nav-link-light">Módulos</a>
            <a href="#simulator" className="nav-link-light">Simulador</a>
            <a href="#process" className="nav-link-light">Nuestro Proceso</a>
            <a href="#pricing" className="nav-link-light">Tarifas</a>
          </nav>
        )}

        <div style={{ display: "flex", gap: isMobile ? "0.4rem" : "0.75rem", alignItems: "center" }}>
          <Link
            href="/proveedores"
            style={{
              display: isMobile ? "none" : "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.5rem 1.1rem",
              borderRadius: "50px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              whiteSpace: "nowrap"
            }}
          >
            🏭 Soy Proveedor
          </Link>
          <Link href="/login" className="btn btn-outline-light-theme" style={{ padding: isMobile ? "0.4rem 0.8rem" : "0.6rem 1.5rem", fontSize: isMobile ? "0.75rem" : "0.9rem" }}>
            Iniciar Sesión
          </Link>
          <Link href="#pricing" className="btn btn-primary-light-theme" style={{ padding: isMobile ? "0.4rem 0.8rem" : "0.65rem 1.5rem", fontSize: isMobile ? "0.75rem" : "0.9rem" }}>
            Crear Cuenta
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "7.5rem 5% 6.5rem 5%",
        background: "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.06) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)",
        position: "relative"
      }} className="dot-grid">
        <div className="section-grid">
          <div>
            <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
              🚀 LIDERANDO EL DESARROLLO B2B EN SALUD
            </div>
            
            <h1 style={{
              fontSize: isMobile ? "2.5rem" : "4.25rem",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              letterSpacing: "-1.5px",
              color: "#0f172a"
            }}>
              Solución Inteligente de <br />
              <span className="text-gradient-blue-light">
                {subheadings[subheadingIndex]}
              </span>
            </h1>
            
            <p style={{
              fontSize: "1.2rem",
              color: "#475569",
              marginBottom: "2.5rem",
              lineHeight: 1.6,
              fontWeight: 400,
              maxWidth: "540px"
            }}>
              Unifica el kárdex regulado por INVIMA, solicitudes clínicas de enfermería y aprovisionamiento directo con distribuidores B2B. Diseñado bajo estándares de alta conversión y seguridad transaccional.
            </p>
            
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              <Link href="#pricing" className="btn btn-primary-light-theme" style={{ fontSize: "1.1rem", padding: "1rem 2.25rem" }}>
                Ver Planes de Precios
              </Link>
              <a href="#simulator" className="btn btn-outline-light-theme" style={{ fontSize: "1.1rem", padding: "1rem 2.25rem" }}>
                Probar Simulador
              </a>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center" }} className="hero-img-animate">
            <div className="img-container-light" style={{ width: "100%", maxWidth: "550px", height: "420px" }}>
              <img
                src="/images/doctors.png"
                alt="Equipo médico cooperando en salud"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "1.5rem",
                right: "1.5rem",
                background: "#ffffff",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <span style={{ fontSize: "2rem" }}>🇨🇴</span>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", margin: 0 }}>Cumplimiento Legal Colombiano</h4>
                  <p style={{ fontSize: "0.85rem", color: "#1863dc", fontWeight: 700, margin: "2px 0 0 0" }}>Resolución 1403 de 2007 (INVIMA)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section style={{
        padding: "3.5rem 5%",
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0"
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
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#1863dc" }}>+10,000</h3>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Recetas Despachadas</p>
          </div>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#10b981" }}>0%</h3>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Riesgo en Auditoría</p>
          </div>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#f97316" }}>&lt; 3 seg</h3>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Actualización de Kárdex</p>
          </div>
          <div>
            <h3 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#8b5cf6" }}>99.99%</h3>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: "0.25rem", fontWeight: 600 }}>Uptime Multi-Sede</p>
          </div>
        </div>
      </section>

      {/* Interactive Feature Tabs Section */}
      <section id="features" style={{ padding: "8rem 5% 5rem 5%" }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
          <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
            🔍 SERVICIOS Y MÓDULOS
          </div>
          <h2 style={{ fontSize: isMobile ? "2rem" : "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1px", color: "#0f172a" }}>
            Diseñado para Cada Eslabón de la Cadena
          </h2>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Navega por las pestañas a continuación para conocer las soluciones interactivas del sistema.
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
            onClick={() => setActiveTab("ips")}
            className={`tab-btn-light ${activeTab === "ips" ? "active" : ""}`}
          >
            🏥 Gestión de IPS y Clínicas
          </button>
          <button
            onClick={() => setActiveTab("farmacia")}
            className={`tab-btn-light ${activeTab === "farmacia" ? "active" : ""}`}
          >
            ⚖️ Kárdex INVIMA y Farmacia
          </button>
          <button
            onClick={() => setActiveTab("b2b")}
            className={`tab-btn-light ${activeTab === "b2b" ? "active" : ""}`}
          >
            🤝 Catálogos B2B y Compras
          </button>
        </div>

        {/* Tab Contents */}
        <div className="section-grid" style={{ minHeight: "450px" }}>
          {activeTab === "ips" && (
            <>
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <span style={{ color: "#1863dc", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>Módulo Hospitalario</span>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0.75rem 0 1.25rem 0", color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Dosificación Segura y Solicitudes de Enfermería
                </h3>
                <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Las enfermeras pueden registrar la administración de dosis a pie de cama y crear solicitudes de insumos clínicos directo a la farmacia de la IPS desde cualquier dispositivo.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="custom-bullet-light">
                    <strong>Administración Clínicas:</strong> Asignación de camas, salas y control de hospitalización en tiempo real.
                  </div>
                  <div className="custom-bullet-light">
                    <strong>Historias Clínicas Integradas:</strong> Notas de evolución y enfermería con codificación oficial <strong>CIE10 y CUPS</strong>.
                  </div>
                  <div className="custom-bullet-light">
                    <strong>Facturación Automática:</strong> Cada medicamento entregado al paciente se carga instantáneamente a su orden de cobro final al egreso.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                <div className="img-container-light" style={{ width: "100%", maxWidth: "500px", height: "380px" }}>
                  <img
                    src="/images/nurse.png"
                    alt="Enfermera cuidando paciente y usando tablet"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "#1863dc",
                    color: "white",
                    padding: "0.4rem 1rem",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "0.8rem"
                  }}>
                    Enfermería 24/7
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "farmacia" && (
            <>
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <span style={{ color: "#f97316", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>Control Técnico Legal</span>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0.75rem 0 1.25rem 0", color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Normativa Farmacéutica sin Errores de Registro
                </h3>
                <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Stratos Health calcula automáticamente el kárdex con saldo posterior después de cada compra, despacho o ajuste, detallando el lote y fecha de vencimiento exigida por la ley colombiana.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="custom-bullet-light bullet-orange-light">
                    <strong>Control Especial (Monopolio del Estado):</strong> Requiere y archiva digitalmente la fórmula médica firmada para medicamentos controlados.
                  </div>
                  <div className="custom-bullet-light bullet-orange-light">
                    <strong>Trazabilidad Legal Inmutable:</strong> Descarga de expedientes y PDF de historias clínicas auditado con dirección IP y justificación requerida por ley.
                  </div>
                  <div className="custom-bullet-light bullet-orange-light">
                    <strong>Reglas de Stock Mínimo/Máximo:</strong> Evita el desabastecimiento con correos automáticos de alerta de reorden.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                <div className="img-container-light" style={{ width: "100%", maxWidth: "500px", height: "380px" }}>
                  <img
                    src="/images/pharmacy.png"
                    alt="Regente organizando kárdex de farmacia"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "#f97316",
                    color: "white",
                    padding: "0.4rem 1rem",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "0.8rem"
                  }}>
                    Kárdex Activo
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "b2b" && (
            <>
              <div style={{ animation: "fadeIn 0.5s ease" }}>
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase" }}>Ecosistema de Distribución</span>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0.75rem 0 1.25rem 0", color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Portal de Proveedores B2B y Compras Inteligentes
                </h3>
                <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                  Los distribuidores farmacéuticos configuran su catálogo de ofertas en tiempo real y delimitan su cobertura departamental. Las clínicas compran al instante.
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div className="custom-bullet-light bullet-emerald-light">
                    <strong>Zonas de Cobertura Regional:</strong> Asigna en qué departamentos de Colombia distribuyes tus productos para recibir órdenes de compra calificadas.
                  </div>
                  <div className="custom-bullet-light bullet-emerald-light">
                    <strong>Órdenes de Compra Seguras:</strong> Recepción y aceptación digital de pedidos con cálculo automático de costos.
                  </div>
                  <div className="custom-bullet-light bullet-emerald-light">
                    <strong>Lead-Times de Entrega:</strong> Configuración de días estimados para asegurar que la clínica planifique correctamente su inventario.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", animation: "fadeIn 0.5s ease" }}>
                <div className="img-container-light" style={{ width: "100%", maxWidth: "500px", height: "380px" }}>
                  <img
                    src="/images/doctors.png"
                    alt="B2B Marketplace farmacéutico"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "#10b981",
                    color: "white",
                    padding: "0.4rem 1rem",
                    borderRadius: "50px",
                    fontWeight: 700,
                    fontSize: "0.8rem"
                  }}>
                    B2B Directo
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulator" style={{
        padding: "8rem 5%",
        background: "transparent",
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
          <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
            ⚡ EXPERIENCIA EN VIVO
          </div>
          <h2 style={{ fontSize: isMobile ? "2rem" : "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1px", color: "#0f172a" }}>
            Simulador de Roles: Gerente vs. Regente
          </h2>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            El rol de <strong style={{ color: "#0f172a", fontWeight: 700 }}>Gerente (Manager)</strong> visualiza reportes sin poder realizar modificaciones. Legalmente, solo el <strong style={{ color: "#0f172a", fontWeight: 700 }}>Regente de Farmacia</strong> realiza movimientos y despachos. ¡Pruébalo cambiando el switch!
          </p>
        </div>

        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "28px",
          padding: "2.5rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)"
        }}>
          {/* Selector de Rol del Simulador */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1.5rem",
            marginBottom: "2.5rem"
          }}>
            <span style={{ fontWeight: 700, color: "#475569" }}>Selecciona un Rol:</span>
            <div style={{
              background: "#f1f5f9",
              padding: "0.4rem",
              borderRadius: "50px",
              display: "flex",
              border: "1px solid #e2e8f0"
            }}>
              <button
                onClick={() => setActiveRole("regente")}
                style={{
                  background: activeRole === "regente" ? "#10b981" : "transparent",
                  color: activeRole === "regente" ? "white" : "#475569",
                  border: "none",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "50px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
              >
                👨‍⚕️ Regente (Operador)
              </button>
              <button
                onClick={() => setActiveRole("gerente")}
                style={{
                  background: activeRole === "gerente" ? "#1863dc" : "transparent",
                  color: activeRole === "gerente" ? "white" : "#475569",
                  border: "none",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "50px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
              >
                💼 Gerente (Solo Lectura)
              </button>
            </div>
          </div>

          <div className="grid-responsive-sim">
            {/* Simulador Interfaz */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "1.75rem",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: activeRole === "regente" ? "#10b981" : "#1863dc", textTransform: "uppercase" }}>
                  {activeRole === "regente" ? "● Modo Escritura Regente" : "● Modo Auditoría Gerente"}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Clínica San Rafael</span>
              </div>

              <div style={{
                background: "#ffffff",
                padding: "1.25rem",
                borderRadius: "14px",
                marginBottom: "1.5rem",
                border: "1px solid #e2e8f0"
              }}>
                <h4 style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 700 }}>Medicamento Seleccionado</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>Acetaminofén 500mg</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1863dc" }}>{simulatedStock} uds</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem" }}>
                  Lote: LOT-2026B | Vence: 12/2028 | INVIMA: RG-20459-01
                </div>
              </div>

              {/* Botón de Acción Condicionado por el Rol */}
              {activeRole === "regente" ? (
                <button
                  onClick={handleSimulateDispatch}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                    padding: "0.85rem",
                    borderRadius: "12px",
                    fontWeight: 700,
                    border: "none",
                    color: "white"
                  }}
                >
                  ⚡ Despachar 20 uds a Piso 3
                </button>
              ) : (
                <div style={{ position: "relative" }}>
                  <button
                    disabled
                    style={{
                      width: "100%",
                      background: "#e2e8f0",
                      color: "#94a3b8",
                      border: "1px solid #cbd5e1",
                      padding: "0.85rem",
                      borderRadius: "12px",
                      fontWeight: 700,
                      cursor: "not-allowed",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    🔒 Acción Deshabilitada
                  </button>
                  <p style={{
                    fontSize: "0.75rem",
                    color: "#ef4444",
                    textAlign: "center",
                    marginTop: "0.75rem",
                    fontWeight: 700
                  }}>
                    El rol Gerente tiene acceso de Solo Lectura por norma legal.
                  </p>
                </div>
              )}
            </div>

            {/* Simulador Historial (Kárdex) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", color: "#0f172a" }}>
                Historial de Kárdex INVIMA en Tiempo Real
              </h4>
              <div style={{
                flex: 1,
                maxHeight: "220px",
                overflowY: "auto",
                background: "#f8fafc",
                borderRadius: "16px",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                border: "1px solid #e2e8f0"
              }}>
                {simulatedLogs.map((log) => (
                  <div key={log.id} style={{
                    fontSize: "0.85rem",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderLeft: `4px solid ${log.type.includes("SALIDA") ? "#ef4444" : "#10b981"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <span style={{ fontWeight: 800, color: "#1e293b" }}>{log.type}</span>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px", fontWeight: 500 }}>
                        Ejecutado por: {log.user}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontWeight: 800,
                        color: log.type.includes("SALIDA") ? "#ef4444" : "#10b981"
                      }}>
                        {log.type.includes("SALIDA") ? `-${log.qty}` : `+${log.qty}`} uds
                      </span>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                        Saldo: {log.balance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Roles & Permissions Section */}
      <section id="roles" style={{
        padding: "8rem 5% 5rem 5%",
        background: "transparent",
        borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 5rem auto" }}>
          <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
            👥 SEGURIDAD DE ACCESOS
          </div>
          <h2 style={{ fontSize: isMobile ? "2rem" : "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1px", color: "#0f172a" }}>
            Ecosistema de Roles y Permisos Clínicos
          </h2>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Cumplimos rigurosamente con la segregación de funciones exigida por las Secretarías de Salud. Cada perfil cuenta con límites de acceso y acciones definidas.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2.5rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {[
            {
              role: "👨‍⚕️ Médico Prescriptor (Doctor)",
              color: "#1863dc",
              desc: "Responsable del diagnóstico clínico y de la prescripción de medicamentos según el catálogo institucional.",
              permits: [
                "Creación de recetas y fórmulas médicas asociadas al diagnóstico CIE-10.",
                "Firma electrónica autorizada de medicamentos generales y de control especial.",
                "Consulta del historial clínico y notas de evolución del paciente."
              ]
            },
            {
              role: "👩‍⚕️ Enfermería 24/7 (Nurse)",
              color: "#3b82f6",
              desc: "Personal a cargo del cuidado clínico a pie de cama y de la administración de dosis programadas.",
              permits: [
                "Visualización en tiempo real del horario de dosificación médica.",
                "Registro de dosis administradas o rechazadas (kárdex de piso).",
                "Solicitud de medicamentos directos a la farmacia interna de la IPS."
              ]
            },
            {
              role: "⚖️ Regente de Farmacia (Pharmacist)",
              color: "#10b981",
              desc: "Director técnico del servicio farmacéutico. Custodio legal del inventario de medicamentos.",
              permits: [
                "Control de inventario (Kárdex) por lotes, marcas y fechas de vencimiento.",
                "Dispensación y validación física de fórmulas médicas prescritas.",
                "Recepción técnica de compras B2B y registro de actas de novedades."
              ]
            },
            {
              role: "💼 Gerente de la IPS (Manager)",
              color: "#f97316",
              desc: "Administrador clínico e institucional. Auditor jefe de costos y operaciones de la IPS.",
              permits: [
                "Visualización de reportes de consumo, kárdex y estados financieros.",
                "Acceso de SOLO LECTURA a inventario para prevenir fraude o alteración técnica.",
                "Configuración de suscripciones, cuentas de cobro y compras B2B globales."
              ]
            },
            {
              role: "📂 Gestor de Archivo (Records Manager)",
              color: "#8b5cf6",
              desc: "Personal administrativo responsable de la admisión de pacientes y custodia legal.",
              permits: [
                "Registro de admisión, datos de contacto e ingreso de pacientes.",
                "Custodia, control de permisos y descarga digital de historias clínicas.",
                "Auditoría inmutable de accesos al expediente (IP, fecha y usuario)."
              ]
            },
            {
              role: "🤝 Distribuidor B2B (Supplier Admin)",
              color: "#06b6d4",
              desc: "Proveedor externo homologado para abastecer a la farmacia de la IPS.",
              permits: [
                "Publicación y actualización de catálogo de productos y precios.",
                "Definición de zonas de cobertura departamental en Colombia.",
                "Gestión de pedidos recibidos, lead times y remisiones de despacho."
              ]
            }
          ].map((item, index) => (
            <div key={index} className="feature-card-light" style={{
              display: "flex",
              flexDirection: "column",
              borderTop: `4px solid ${item.color}`,
              padding: "2rem"
            }}>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {item.role}
              </h3>
              <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem", fontWeight: 500 }}>
                {item.desc}
              </p>
              <div style={{ height: "1px", background: "#f1f5f9", marginBottom: "1.5rem" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "auto" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>Permisos del Sistema</span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {item.permits.map((permit, pIdx) => (
                    <li key={pIdx} style={{ fontSize: "0.85rem", color: "#334155", display: "flex", gap: "0.5rem", alignItems: "flex-start", fontWeight: 500 }}>
                      <span style={{ color: item.color, fontWeight: "bold" }}>•</span>
                      <span>{permit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Electronic Signature & Legal Compliance Section */}
      <section id="signature" style={{
        padding: "8rem 5%",
        background: "transparent",
        borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }} className="section-grid">
          <div>
            <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
              🔒 GARANTÍA LEGAL Y TÉCNICA
            </div>
            <h2 style={{ fontSize: isMobile ? "2rem" : "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1.5px", color: "#0f172a", lineHeight: 1.1 }}>
              Sistema de Firma e Inmutabilidad de Historias Clínicas
            </h2>
            <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              Cumplimos rigurosamente con la normativa de seguridad de datos en salud y la Resolución 1995 de 1999 de Colombia, garantizando la inalterabilidad de los expedientes y un registro completo de accesos auditables.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                {
                  title: "1. Cierre de Historias e Inmutabilidad (Firma con 2FA)",
                  desc: "Las evoluciones médicas y notas de enfermería se firman digitalmente por el profesional tratante validándose mediante su código 2FA. Al firmarse, pasan a estado bloqueado en base de datos para prevenir alteraciones posteriores."
                },
                {
                  title: "2. Doble Factor de Autenticación para Acceso y Firmas",
                  desc: "El personal clínico resguarda el ingreso y la firma de historias configurando verificación en dos pasos con Google o Microsoft Authenticator, eliminando el riesgo de firmas sin autorización."
                },
                {
                  title: "3. Justificación Obligatoria de Descargas y Exportaciones",
                  desc: "Para proteger el Habeas Data, el sistema exige una justificación escrita obligatoria y subir un soporte de autorización antes de permitir descargar cualquier expediente en PDF."
                },
                {
                  title: "4. Trazabilidad de Auditoría por IP y Fecha",
                  desc: "Cada firma, anexo legal (Addendum) o acceso guarda de forma automática la dirección IP del operador y la fecha exacta del servidor para inspecciones técnicas de la Secretaría de Salud."
                }
              ].map((step, idx) => (
                <div key={idx} style={{ display: "flex", gap: "1rem" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(24, 99, 220, 0.1)",
                    color: "#1863dc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem 0" }}>{step.title}</h4>
                    <p style={{ color: "#475569", fontSize: "0.9rem", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "28px",
              padding: "2.5rem",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.04)",
              position: "relative"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>✓ Registro Clínico Guardado</span>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>ID: REC-2026-88F</span>
              </div>

              {/* Contenido Simulado de Receta */}
              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#0f172a", fontWeight: 800 }}>Médico: Dr. Alejandro Valencia</h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Registro Médico: RM-20594921</p>
                <div style={{ height: "1px", background: "#e2e8f0", margin: "1rem 0" }} />
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>Evolución: Paciente presenta mejoría clínica.</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>Estado del Registro: SIGNED (Bloqueado / Inmutable)</p>
              </div>

              {/* Firma Validada Visualmente */}
              <div style={{
                border: "2px dashed #10b981",
                background: "rgba(16, 185, 129, 0.03)",
                borderRadius: "16px",
                padding: "1.25rem",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🔒</div>
                <div style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "#059669",
                  letterSpacing: "0.5px",
                  fontFamily: "'Courier New', Courier, monospace"
                }}>
                  VALENCIA.A_SIGNED
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                  Firma IP: 192.168.10.45
                </div>
                <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontFamily: "monospace", marginTop: "2px" }}>
                  Estampado: {new Date().toLocaleDateString("es-CO")} COT
                </div>

                {/* Sello de Autenticado */}
                <div style={{
                  position: "absolute",
                  bottom: "-10px",
                  right: "-10px",
                  border: "3px solid #10b981",
                  borderRadius: "50%",
                  color: "#10b981",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  padding: "6px",
                  transform: "rotate(-15deg)",
                  textTransform: "uppercase",
                  background: "#ffffff",
                  opacity: 0.85
                }}>
                  INMUTABLE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap / Proceso Section (Estilo Togrow) */}
      <section id="process" style={{ padding: "8rem 5%" }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 5rem auto" }}>
          <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
            📋 CÓMO EMPEZAR
          </div>
          <h2 style={{ fontSize: isMobile ? "2rem" : "3.25rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-1px", color: "#0f172a" }}>
            Proceso de Integración en 4 Pasos
          </h2>
          <p style={{ color: "#475569", fontSize: "1.15rem", lineHeight: 1.6 }}>
            Nuestra arquitectura SaaS te permite habilitar tu clínica o cobertura de proveedor en minutos de forma 100% autogestionada.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "2rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {[
            { step: "01", title: "Auto-Registro Seguro", desc: "Ingresa tu NIT, datos de la IPS y configura tu tarjeta o medio de pago (Wompi, Stripe, PayPal) de forma atómica y cifrada." },
            { step: "02", title: "Carga de Catálogos", desc: "El regente carga el inventario inicial con lotes, vencimientos y códigos INVIMA. Si eres proveedor, cargas tus ofertas y precios." },
            { step: "03", title: "Habilitación de Personal", desc: "Crea cuentas seguras con roles específicos para médicos, enfermeros, auxiliares y administradores, listos para cooperar." },
            { step: "04", title: "Operación & Compras", desc: "Las enfermeras solicitan dosis, el kárdex se actualiza automáticamente y se generan órdenes de compra B2B automáticas." }
          ].map((item, index) => (
            <div key={index} className="feature-card-light" style={{
              position: "relative",
              paddingTop: "3rem"
            }}>
              <div style={{
                position: "absolute",
                top: "1.5rem",
                left: "2.25rem",
                fontSize: "2.5rem",
                fontWeight: 900,
                background: "linear-gradient(135deg, #1863dc, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: 0.8
              }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "1rem 0 0.75rem 0", color: "#0f172a" }}>
                {item.title}
              </h3>
              <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / Planes Section */}
      <section id="pricing" style={{
        padding: "8rem 5% 7rem 5%",
        background: "transparent",
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        position: "relative"
      }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 4rem auto" }}>
          <div className="badge-premium-light" style={{ marginBottom: "1.5rem" }}>
            💲 PRECIOS DEL SERVICIO
          </div>
          <h2 style={{
            fontSize: isMobile ? "2rem" : "3.25rem",
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: "-1px",
            marginBottom: "1.5rem",
            color: "#0f172a"
          }}>
            Nuestros Planes de Suscripción
          </h2>
          <p style={{ color: "#475569", fontSize: "1rem", marginTop: "1rem", lineHeight: 1.6 }}>
            Todos los planes incluyen hasta 50 usuarios activos. El precio que ves es lo que pagas al mes.
          </p>
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
            // La landing muestra solo el precio mensual base de cada plan
            // El descuento del 20% por facturación anual se aplica al registrarse
            const monthlyPrice = plan.price;
            const durationLabel = plan.durationMonths === 1 
              ? "Mes a mes" 
              : plan.durationMonths === 12 
                ? "Compromiso 12 meses"
                : `Compromiso ${plan.durationMonths} meses`;

            return (
              <div key={plan.id} className="card-plan-light" style={{
                flex: "1 1 320px",
                maxWidth: "380px",
                padding: "2.5rem 2rem",
                display: "flex",
                flexDirection: "column"
              }}>
                
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
                  {plan.name}
                </h3>
                
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", margin: "1rem 0" }}>
                  <span style={{ fontSize: "2.75rem", fontWeight: 900, color: "#1863dc" }}>
                    ${monthlyPrice.toLocaleString("es-CO")}
                  </span>
                  <span style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: 500 }}>
                    / mes
                  </span>
                </div>
                
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "20px", padding: "0.3rem 0.75rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0369a1" }}>{durationLabel}</span>
                </div>

                
                <div style={{ height: "1px", background: "#e2e8f0", marginBottom: "2rem" }} />
                
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0 2.5rem 0" }}>
                  <span style={{ fontSize: "2.5rem" }}>📋</span>
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
                            color: "#1863dc",
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                            textAlign: "center",
                            lineHeight: 1.4
                          }}
                        >
                          Ver las {featuresList.length} características completas
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
                            color: "#1863dc",
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0
                          }}
                        >
                          Ver características del plan
                        </button>
                      );
                    }
                  })()}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "auto" }}>
                  <Link href={`/register?planId=${plan.id}&billing=monthly`} className="btn-primary-light-theme" style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "0.9rem",
                    fontSize: "1.05rem",
                    borderRadius: "50px",
                    textDecoration: "none",
                    textAlign: "center",
                    fontWeight: 700,
                    display: "inline-block"
                  }}>
                    Comenzar Ahora
                  </Link>
                  <button 
                    type="button"
                    onClick={() => setSelectedPlanForModal(plan)}
                    className="btn-outline-light-theme" 
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      fontSize: "0.95rem",
                      borderRadius: "50px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "2px solid #e2e8f0",
                      color: "#475569",
                      background: "#ffffff"
                    }}
                  >
                    Ver Ficha Técnica
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Banner Proveedores */}
      <section style={{
        padding: "4rem 5%",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
        borderTop: "1px solid #1e40af",
        borderBottom: "1px solid #1e40af",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decoración de fondo */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #10b981 0%, transparent 50%)"
        }} />
        <div style={{
          maxWidth: "900px", margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: "2rem", position: "relative", zIndex: 1
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0,
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.75rem", boxShadow: "0 8px 24px rgba(16,185,129,0.35)"
            }}>
              🏭
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 0.25rem 0" }}>
                DISTRIBUIDORES &amp; LABORATORIOS
              </p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", margin: "0 0 0.35rem 0", lineHeight: 1.2 }}>
                ¿Eres proveedor o distribuidor farmacéutico?
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0, fontWeight: 400 }}>
                Conecta con IPS y clínicas de toda Colombia. Gestiona catálogos, pedidos B2B y facturación en un solo lugar.
              </p>
            </div>
          </div>
          <Link
            href="/proveedores"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.6rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white", fontWeight: 800, fontSize: "1rem",
              padding: "0.9rem 2rem", borderRadius: "50px", textDecoration: "none",
              boxShadow: "0 8px 24px rgba(16,185,129,0.4)",
              whiteSpace: "nowrap", flexShrink: 0,
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 32px rgba(16,185,129,0.5)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(16,185,129,0.4)";
            }}
          >
            Soy Proveedor — Ver Portal
            <span style={{ fontSize: "1.1rem" }}>→</span>
          </Link>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faqs" style={{
        padding: "5rem 5% 8rem 5%",
        background: "transparent"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 900, textAlign: "center", marginBottom: "3rem", letterSpacing: "-0.5px", color: "#0f172a" }}>
            Preguntas Frecuentes
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                q: "¿El sistema cumple con el estándar de kárdex de la Res. 1403 de Colombia?",
                a: "Sí, el kárdex de Stratos Health está estructurado para registrar automáticamente cada entrada (por compra o devolución), salida (por despacho de enfermería) y ajuste. Detalla lote, fecha de vencimiento, saldo final y el responsable legal de cada movimiento de manera transparente."
              },
              {
                q: "¿Cuál es la diferencia entre el rol de Gerente y Regente?",
                a: "Por normativas de salud colombianas, la manipulación técnica y compras farmacéuticas recae únicamente sobre el Regente de Farmacia. Stratos Health lo garantiza: el rol de Gerente puede acceder a reportes e inventarios con fines de auditoría pero tiene inhabilitados todos los botones de despachos, compras y movimientos de inventario."
              },
              {
                q: "¿Cómo funciona la integración de tarjetas y pasarelas de pago?",
                a: "La plataforma cuenta con integración nativa para pasarelas líderes (Wompi, Stripe y PayPal) listas para producción. Al configurar las API Keys correspondientes en el panel de control, las IPS pueden habilitar cobros reales de suscripciones y facturación asistencial de manera inmediata."
              }
            ].map((item, index) => {
              const isOpen = faqOpen === index;
              return (
                <div key={index} style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
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
                      color: "#0f172a",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <span>{item.q}</span>
                    <span style={{ fontSize: "1.2rem", color: "#1863dc", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▼
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: "0 1.5rem 1.5rem 1.5rem",
                      color: "#475569",
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
        borderTop: "1px solid #e2e8f0",
        background: "#0f172a",
        color: "#94a3b8"
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
              Ecosistema B2B de Salud para Clínicas, IPS y Proveedores. Total cumplimiento normativo INVIMA.
            </p>
          </div>

          <div style={{ display: "flex", gap: "4rem" }}>
            <div>
              <h5 style={{ color: "white", fontWeight: 800, marginBottom: "1rem" }}>Ecosistema</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><a href="#features" style={{ color: "#94a3b8", textDecoration: "none" }}>Para IPS / Clínicas</a></li>
                <li><a href="#features" style={{ color: "#94a3b8", textDecoration: "none" }}>Control de Farmacia</a></li>
                <li><Link href="/proveedores" style={{ color: "#94a3b8", textDecoration: "none" }}>Proveedores B2B</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 style={{ color: "white", fontWeight: 800, marginBottom: "1rem" }}>Plataforma</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li><Link href="/login" style={{ color: "#94a3b8", textDecoration: "none" }}>Iniciar Sesión</Link></li>
                <li><Link href="#pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>Planes de Precios</Link></li>
                <li><Link href="/register" style={{ color: "#94a3b8", textDecoration: "none" }}>Auto-Registro IPS</Link></li>
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
          <p>© {new Date().getFullYear()} Stratos Health. Todos los derechos reservados. Diseñado para el cumplimiento de la Resolución 1403 de 2007 de Colombia.</p>
        </div>
      </footer>

      {/* Floating Chat Assistant Widget (WhatsApp/Support Style like Togrow) */}
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
              background: "#1863dc",
              color: "white",
              border: "none",
              borderRadius: "50px",
              padding: "0.9rem 1.6rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              boxShadow: "0 10px 25px rgba(24, 99, 220, 0.3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "transform 0.3s"
            }}
            className="chat-trigger-light"
          >
            <span style={{ fontSize: "1.25rem" }}>💬</span> Soporte Stratos Health
          </button>
        ) : (
          <div style={{
            width: "320px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Cabezote del Chat */}
            <div style={{
              background: "#1863dc",
              padding: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "white"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🤖</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800 }}>Soporte Stratos Health</h4>
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

            {/* Cuerpo de Mensajes */}
            <div style={{
              height: "220px",
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              background: "#f8fafc"
            }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === "bot" ? "flex-start" : "flex-end",
                    background: msg.sender === "bot" ? "#ffffff" : "#1863dc",
                    border: msg.sender === "bot" ? "1px solid #e2e8f0" : "none",
                    color: msg.sender === "bot" ? "#1e293b" : "white",
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
                  border: "1px solid #e2e8f0",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "14px",
                  fontSize: "0.8rem",
                  color: "#64748b"
                }}>
                  Escribiendo...
                </div>
              )}
            </div>

            {/* Sugerencias Rápidas */}
            <div style={{
              padding: "0.75rem",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem"
            }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, paddingLeft: "0.25rem" }}>Preguntas sugeridas:</span>
              <button
                onClick={() => handleChatOption(
                  "¿Cumple con INVIMA?",
                  "¡Totalmente! Habilitamos kárdex digital automático, lotes, vencimientos y alertas preventivas bajo la Res. 1403 de 2007."
                )}
                className="chat-sugg-btn-light"
              >
                ⚖️ ¿Cumple con INVIMA?
              </button>
              <button
                onClick={() => handleChatOption(
                  "Quiero ver precios",
                  "Tenemos planes adaptados para Clínicas e IPS. Conoce el Plan Básico y el Plan Premium en la sección de Tarifas."
                )}
                className="chat-sugg-btn-light"
              >
                💵 Ver precios de suscripción
              </button>
              <button
                onClick={() => handleChatOption(
                  "Diferencia de Roles",
                  "El Regente despacha y compra. El Gerente solo visualiza reportes sin poder realizar movimientos en el kárdex físico."
                )}
                className="chat-sugg-btn-light"
              >
                🔒 Diferencia de Roles
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Technical Specifications Modal */}
      {selectedPlanForModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
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
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            color: "#1e293b",
            animation: "fadeIn 0.3s ease",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.75rem 2rem",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#1863dc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Especificaciones Técnicas</span>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 900, color: "#0f172a" }}>Plan {selectedPlanForModal.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "2rem",
                  color: "#64748b",
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
              
              {/* Resumen del Plan */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", background: "#f8fafc", padding: "1.25rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Costo base (mes a mes)</span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1863dc", marginTop: "2px" }}>
                    ${Math.round(selectedPlanForModal.price).toLocaleString("es-CO")}
                    <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}> / mes</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600, marginTop: "4px" }}>
                    Facturación anual: ${Math.round(selectedPlanForModal.price * 0.8).toLocaleString("es-CO")}/mes (-20%)
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Límite de usuarios</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{selectedPlanForModal.maxUsers} Activos</div>
                </div>
              </div>

              {/* Módulos Incluidos */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Módulos Habilitados</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedPlanForModal.features as string);
                      const featuresList = Array.isArray(parsed) ? parsed : [];
                      return featuresList.map((feature, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>
                          <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
                          <span>{feature}</span>
                        </li>
                      ));
                    } catch (e) {
                      return <li style={{ fontSize: "0.85rem", color: "#64748b" }}>Características estándar de la plataforma.</li>;
                    }
                  })()}
                </ul>
              </div>

              {/* Garantías Técnicas y Seguridad */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ficha Técnica & Cumplimiento</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Seguridad de Firma e Inmutabilidad</span>
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>Cierre de Historias Clínicas (SIGNED)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Doble Factor de Autenticación (MFA)</span>
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>TOTP (Google Authenticator)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Control de Kardex (INVIMA Res. 1403)</span>
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>Registro Automático por Lote/Vence</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Auditoría de Descarga de PDF</span>
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>Justificación Obligatoria + Soporte</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Seguridad de Base de Datos y SSL</span>
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>Cifrado SSL de 256 bits</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "1.25rem 2rem",
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: "1rem"
            }}>
              <button
                type="button"
                onClick={() => setSelectedPlanForModal(null)}
                style={{
                  flex: 1,
                  padding: "0.8rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "50px",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.95rem"
                }}
              >
                Cerrar Ficha
              </button>
              <Link
                href={`/register?planId=${selectedPlanForModal.id}&billing=monthly`}
                style={{
                  flex: 1.5,
                  padding: "0.8rem",
                  border: "none",
                  borderRadius: "50px",
                  background: "#1863dc",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  textAlign: "center",
                  textDecoration: "none"
                }}
              >
                Comenzar Suscripción
              </Link>
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

    /* Estilos Adicionales de Diseño e Interacción Light */
    .dot-grid {
      background-image: radial-gradient(rgba(15, 23, 42, 0.05) 1.5px, transparent 0);
      background-size: 24px 24px;
    }

    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .grid-responsive-sim {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5rem;
    }

    .nav-link-light {
      color: #475569;
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }
    .nav-link-light:hover {
      color: #1863dc;
    }

    .btn-primary-light-theme {
      background: #1863dc;
      color: white;
      border: none;
      font-weight: 700;
      border-radius: 50px;
      padding: 0.65rem 1.5rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(24, 99, 220, 0.2);
    }
    .btn-primary-light-theme:hover {
      background: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(24, 99, 220, 0.35);
    }

    .btn-outline-light-theme {
      background: transparent;
      color: #1863dc;
      border: 2px solid #1863dc;
      font-weight: 700;
      border-radius: 50px;
      padding: 0.6rem 1.5rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
    }
    .btn-outline-light-theme:hover {
      background: rgba(24, 99, 220, 0.05);
      transform: translateY(-2px);
    }

    .badge-premium-light {
      background: rgba(24, 99, 220, 0.08);
      border: 1px solid rgba(24, 99, 220, 0.2);
      color: #1863dc;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 0.4rem 1rem;
      border-radius: 50px;
      display: inline-block;
      letter-spacing: 0.5px;
    }

    .text-gradient-blue-light {
      background: linear-gradient(135deg, #1863dc 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .img-container-light {
      position: relative;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.06);
      transition: all 0.5s ease;
      background: #f8fafc;
    }
    .img-container-light:hover {
      transform: scale(1.02);
      box-shadow: 0 30px 60px rgba(24, 99, 220, 0.15);
      border-color: rgba(24, 99, 220, 0.3);
    }

    .tab-btn-light {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      padding: 0.8rem 1.75rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tab-btn-light:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: translateY(-2px);
    }
    .tab-btn-light.active {
      background: #1863dc;
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 15px rgba(24, 99, 220, 0.25);
    }

    .custom-bullet-light {
      position: relative;
      padding-left: 2rem;
      margin-bottom: 1rem;
      color: #334155;
      line-height: 1.5;
      font-weight: 500;
    }
    .custom-bullet-light::before {
      content: "✓";
      position: absolute;
      left: 0;
      top: 0;
      color: #1863dc;
      font-weight: 900;
      font-size: 1.15rem;
    }

    .bullet-orange-light::before { color: #f97316; }
    .bullet-emerald-light::before { color: #10b981; }

    .feature-card-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 2.25rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
      transition: all 0.4s ease;
    }
    .feature-card-light:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 45px rgba(24, 99, 220, 0.08);
      border-color: rgba(24, 99, 220, 0.2);
    }

    .card-plan-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 28px;
      padding: 3rem 2.25rem;
      transition: all 0.4s ease;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
    }
    .card-plan-light:hover {
      transform: translateY(-10px);
      border-color: rgba(24, 99, 220, 0.3);
      box-shadow: 0 25px 50px rgba(24, 99, 220, 0.08);
    }
    .card-plan-light.highlighted {
      border: 2px solid #1863dc;
      box-shadow: 0 20px 45px rgba(24, 99, 220, 0.12);
    }

    .chat-sugg-btn-light {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      font-weight: 700;
    }
    .chat-sugg-btn-light:hover {
      background: rgba(24, 99, 220, 0.05);
      border-color: rgba(24, 99, 220, 0.3);
      color: #1863dc;
    }

    .chat-trigger-light:hover {
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
      .grid-responsive-sim {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .custom-bullet-light {
        padding-left: 0;
        display: inline-block;
        text-align: left;
        max-width: 500px;
        margin: 0 auto 1rem auto;
      }
      .custom-bullet-light::before {
        display: none;
      }
    }
  `}} />
);
