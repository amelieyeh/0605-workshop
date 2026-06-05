import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deidentifyMember, type Role } from "@/lib/deidentify";

export const dynamic = "force-dynamic";

function parseRole(value: string | null): Role {
  // 預設 viewer：拿不到合法角色時走最嚴格的遮蔽
  return value === "admin" ? "admin" : "viewer";
}

export async function GET(req: NextRequest) {
  const role = parseRole(req.nextUrl.searchParams.get("role"));

  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
  });

  // 關鍵：去識別化在 server 完成，回給前端的已是該角色能看的版本。
  // viewer 角色下，原始個資永遠不會離開後端。
  const data = members.map((m) => deidentifyMember(m, role));

  return NextResponse.json({ role, count: data.length, members: data });
}
