import { NextResponse } from "next/server";
import { turso } from "@/lib/turso/queryBuilder";
import { Service } from "@/data/services";

type ServiceType = Service.Type;

export async function GET() {
  const services = await turso<ServiceType>("services").orderBy("id", "ASC").get();
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const body: Omit<ServiceType, "id"> = await req.json();
  await turso<ServiceType>("services").create(body).save();
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const body: ServiceType = await req.json();
  await turso<ServiceType>("services").where("id", body.id).update(body);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const payload = (await req.json()) as { id: number };
  await turso<ServiceType>("services")
    .where("id", payload.id)
    .delete();
  return NextResponse.json({ success: true });
}
