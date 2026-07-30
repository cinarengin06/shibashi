import type { ShibashiSyncPayload } from "./sync";

export type SupabaseSyncConfig = {
  publishableKey: string;
  supabaseUrl: string;
};

export type SupabaseSyncResponse = {
  payload: ShibashiSyncPayload;
  syncedAt: string;
};

export function hasSupabaseSyncConfig(
  config: Partial<SupabaseSyncConfig>,
): config is SupabaseSyncConfig {
  return Boolean(config.supabaseUrl?.trim() && config.publishableKey?.trim());
}

export async function syncShibashiStateWithSupabase({
  accessToken,
  config,
  payload,
  signal,
  syncCode,
}: {
  accessToken?: string;
  config: SupabaseSyncConfig;
  payload: ShibashiSyncPayload;
  signal?: AbortSignal;
  syncCode: string;
}): Promise<SupabaseSyncResponse> {
  const response = await fetch(
    `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/sync_shibashi_state`,
    {
      body: JSON.stringify({
        p_payload: payload,
        p_sync_code: syncCode,
      }),
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${accessToken ?? config.publishableKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal,
    },
  );

  const result = (await response.json()) as
    | ShibashiSyncPayload
    | { code?: string; details?: string; hint?: string; message?: string };

  if (!response.ok) {
    const error = result as {
      code?: string;
      details?: string;
      hint?: string;
      message?: string;
    };
    throw new Error(
      error.message ??
        error.details ??
        "Supabase senkronizasyon servisi yanıt vermedi.",
    );
  }

  if (
    !result ||
    typeof result !== "object" ||
    !("schemaVersion" in result) ||
    result.schemaVersion !== 1
  ) {
    throw new Error("Supabase geçersiz bir senkronizasyon paketi döndürdü.");
  }

  return {
    payload: result as ShibashiSyncPayload,
    syncedAt: new Date().toISOString(),
  };
}
