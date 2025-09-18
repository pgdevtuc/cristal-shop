// app/api/get-token/route.ts
import { validateTokenDB } from "@/lib/validateTokenDB";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return new Response("Missing ID", { status: 400 });

  const token = await validateTokenDB(id);

  return Response.json({ token });
}
