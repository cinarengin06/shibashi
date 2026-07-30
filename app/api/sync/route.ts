import { NextResponse } from "next/server";
import {
  compactSyncPayload,
  hasSupabaseSyncConfig,
  syncShibashiStateWithSupabase,
  type ShibashiSyncPayload,
} from "@/packages/shen-domain";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function isValidCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2}$/.test(value.trim().toUpperCase())
  );
}

function isPayload(value: unknown): value is ShibashiSyncPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<ShibashiSyncPayload>;
  return (
    payload.schemaVersion === 1 &&
    typeof payload.updatedAt === "string" &&
    Boolean(payload.history) &&
    Boolean(payload.journey) &&
    Boolean(payload.profile)
  );
}

function getSupabaseConfig() {
  return {
    publishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl:
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders, status: 204 });
}

export function GET() {
  return NextResponse.json(
    {
      backend: "supabase",
      configured: hasSupabaseSyncConfig(getSupabaseConfig()),
      ok: true,
      schemaVersion: 1,
      service: "shibashi-sync",
    },
    { headers: corsHeaders },
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_000_000) {
    return NextResponse.json(
      { error: "Senkronizasyon paketi çok büyük.", ok: false },
      { headers: corsHeaders, status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON.", ok: false },
      { headers: corsHeaders, status: 400 },
    );
  }

  const input = body as { payload?: unknown; syncCode?: unknown };
  if (!isValidCode(input.syncCode) || !isPayload(input.payload)) {
    return NextResponse.json(
      { error: "Eşleştirme kodu veya veri paketi geçersiz.", ok: false },
      { headers: corsHeaders, status: 400 },
    );
  }

  const config = getSupabaseConfig();
  if (!hasSupabaseSyncConfig(config)) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmadı.", ok: false },
      { headers: corsHeaders, status: 503 },
    );
  }

  try {
    const result = await syncShibashiStateWithSupabase({
      config,
      payload: compactSyncPayload(input.payload),
      signal: request.signal,
      syncCode: input.syncCode.trim().toUpperCase(),
    });
    return NextResponse.json(
      {
        ok: true,
        payload: result.payload,
        syncedAt: result.syncedAt,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Supabase senkronizasyonu başarısız.",
        ok: false,
      },
      { headers: corsHeaders, status: 502 },
    );
  }
}
