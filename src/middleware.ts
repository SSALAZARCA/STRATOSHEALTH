import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Force HTTPS in production behind reverse proxy
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "stratoshealth.site";
  if (proto === "http" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(`https://${host}${req.nextUrl.pathname}${req.nextUrl.search}`, 301);
  }

  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register";
  const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/proveedores" || req.nextUrl.pathname.startsWith("/legal") || isAuthPage || req.nextUrl.pathname.startsWith("/api/") || req.nextUrl.pathname.startsWith("/images/");
  const userRole = req.auth?.user?.role;
  const userTenant = req.auth?.user?.tenantId;

  if (isAuthPage) {
    if (isLoggedIn) {
      if (userRole === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/superadmin/dashboard", req.url));
      }
      if (userRole === "SUPPLIER_ADMIN") {
        return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
      }
      if (userTenant) {
        if (userRole === "NURSE") return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/nurse`, req.url));
        if (userRole === "DOCTOR") return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/doctor`, req.url));
        if (userRole === "RECORDS_MANAGER") return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/records`, req.url));
        if (userRole === "PHARMACIST") return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/pharmacist`, req.url));
        if (userRole === "MANAGER") return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/manager`, req.url));
        return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard`, req.url));
      }
    }
    return null;
  }

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protección de Superadmin
  if (req.nextUrl.pathname.startsWith("/superadmin")) {
    if (userRole !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protección de Proveedores
  if (req.nextUrl.pathname.startsWith("/supplier")) {
    if (userRole !== "SUPPLIER_ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protección de Tenant
  if (req.nextUrl.pathname.startsWith("/pharmacy/")) {
    const urlTenantId = req.nextUrl.pathname.split("/")[2];
    if (userTenant !== urlTenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // Si es ENFERMERA, bloquearle acceso a reportes, facturación, compras, inventario puro.
    if (userRole === "NURSE" && (
      req.nextUrl.pathname.includes("/inventory") ||
      req.nextUrl.pathname.includes("/suppliers") ||
      req.nextUrl.pathname.includes("/purchase-orders") ||
      req.nextUrl.pathname.includes("/billing") ||
      req.nextUrl.pathname.includes("/reports") ||
      req.nextUrl.pathname.includes("/pharmacist") ||
      req.nextUrl.pathname.includes("/doctor")
    )) {
      return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/nurse`, req.url));
    }

    // Si es MÉDICO, bloquear farmacia, compras, facturación. Solo historia y dashboard
    if (userRole === "DOCTOR" && (
      req.nextUrl.pathname.includes("/inventory") ||
      req.nextUrl.pathname.includes("/suppliers") ||
      req.nextUrl.pathname.includes("/purchase-orders") ||
      req.nextUrl.pathname.includes("/billing") ||
      req.nextUrl.pathname.includes("/reports") ||
      req.nextUrl.pathname.includes("/pharmacist") ||
      req.nextUrl.pathname.includes("/nurse")
    )) {
      return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/doctor`, req.url));
    }

    // Si es RECORDS_MANAGER, solo archivo de historias clínicas.
    if (userRole === "RECORDS_MANAGER" && (
      req.nextUrl.pathname.includes("/inventory") ||
      req.nextUrl.pathname.includes("/suppliers") ||
      req.nextUrl.pathname.includes("/purchase-orders") ||
      req.nextUrl.pathname.includes("/billing") ||
      req.nextUrl.pathname.includes("/reports") ||
      req.nextUrl.pathname.includes("/pharmacist") ||
      req.nextUrl.pathname.includes("/nurse") ||
      req.nextUrl.pathname.includes("/doctor")
    )) {
      return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/records`, req.url));
    }

    // Si es REGENTE, bloquearle facturación y compras gerenciales
    if (userRole === "PHARMACIST" && (
      req.nextUrl.pathname.includes("/billing") ||
      req.nextUrl.pathname.includes("/reports") ||
      req.nextUrl.pathname.includes("/doctor") ||
      req.nextUrl.pathname.includes("/records")
    )) {
      return NextResponse.redirect(new URL(`/pharmacy/${userTenant}/dashboard/pharmacist`, req.url));
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
