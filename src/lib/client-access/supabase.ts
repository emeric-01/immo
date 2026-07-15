import "server-only";

type ClientSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export function getClientSupabaseConfig(): ClientSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    serviceRoleKey,
    url: url.replace(/\/$/, ""),
  };
}

export async function clientSupabaseRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getClientSupabaseConfig();

  if (!config) {
    throw new Error("Supabase n'est pas configure pour l'espace client.");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase client request failed (${response.status}): ${error}`);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
