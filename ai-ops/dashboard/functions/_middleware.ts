// Cloudflare Pages Function: password-protects the whole dashboard (free plan).
// Set DASHBOARD_PASSWORD in the Pages project settings. Without it, nobody gets in.

interface Context {
  request: Request;
  env: { DASHBOARD_PASSWORD?: string };
  next: () => Promise<Response>;
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const onRequest = async ({ request, env, next }: Context): Promise<Response> => {
  const password = env.DASHBOARD_PASSWORD;
  if (!password) return new Response("Dashboard locked: set DASHBOARD_PASSWORD in Cloudflare Pages settings.", { status: 503 });

  const header = request.headers.get("Authorization") ?? "";
  let given = "";
  try {
    const decoded = header.startsWith("Basic ") ? atob(header.slice(6)) : "";
    given = decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    // Malformed header: treat as no password.
  }
  if (given && sameString(given, password)) {
    const res = await next();
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Robots-Tag", "noindex");
    return new Response(res.body, { status: res.status, headers });
  }
  return new Response("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="PalmPop HQ", charset="UTF-8"' },
  });
};
