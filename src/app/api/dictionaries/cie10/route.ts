import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await prisma.$queryRaw`
    SELECT * FROM Cie10 
    WHERE LOWER(code) LIKE LOWER(${'%' + q + '%'}) 
       OR LOWER(description) LIKE LOWER(${'%' + q + '%'})
    LIMIT 15
  `;

  return NextResponse.json(results);
}
