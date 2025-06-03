import { NextResponse } from "next/server";

// [!region signer-route]
export async function POST(req: Request, context: { params: Promise<{ routes: string[] }> }) {
  const { params } = context;
  const resolvedParams = await params; // Await the promise

  const apiUrl = "https://api.g.alchemy.com";
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "ALCHEMY_API_KEY is not set" }, { status: 500 });
  }

  const body = await req.json();

  const res = await fetch(`${apiUrl}/${resolvedParams.routes.join("/")}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json(await res.json().catch(() => ({})), {
      status: res.status,
    });
  }

  return NextResponse.json(await res.json());
}
// [!endregion signer-route]
