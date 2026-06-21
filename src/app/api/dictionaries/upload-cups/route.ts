import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    
    // Asumimos un CSV con formato: codigo,descripcion
    // o separado por punto y coma: codigo;descripcion
    const records: { code: string, description: string }[] = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i].trim();
      if (!line) continue;
      
      const separator = line.includes(";") ? ";" : ",";
      const parts = line.split(separator);
      
      if (parts.length >= 2) {
        const code = parts[0].replace(/['"]/g, "").trim();
        const desc = parts.slice(1).join(separator).replace(/['"]/g, "").trim();
        
        if (code && desc) {
          records.push({ code, description: desc });
        }
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "El archivo parece estar vacío o tiene un formato incorrecto." }, { status: 400 });
    }

    // Insertar en lotes
    await prisma.cups.deleteMany({});
    
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await prisma.cups.createMany({ data: batch });
    }

    // Redirigir de vuelta a la página anterior
    return NextResponse.redirect(new URL(request.headers.get("referer") || "/", request.url), 303);
    
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
