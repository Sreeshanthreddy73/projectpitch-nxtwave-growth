// Cookie names and parsing shared by proxy.ts (which sets them) and
// lib/tracking.ts (which reads them). No secrets and no server-only imports.

export const COOKIE = {
  session: "pp_sid", // anonymous session id (uuid)
  attribution: "pp_attr", // first-touch source / medium / campaign / referral code
  variant: "pp_v", // landing page variant: a | b
  ownCode: "pp_code", // this visitor's own referral code, set after registering
} as const;

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type Attribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  ref: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID.test(value));
}

// utm_* values: lower-case slug, max 60 chars. Anything else is dropped.
export function cleanParam(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase();
  return v && /^[a-z0-9_.-]{1,60}$/.test(v) ? v : null;
}

export function cleanRef(value: string | null | undefined): string | null {
  const v = value?.trim().toUpperCase();
  return v && /^[A-Z0-9]{6,12}$/.test(v) ? v : null;
}

export function parseAttribution(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    return {
      source: cleanParam(o.source),
      medium: cleanParam(o.medium),
      campaign: cleanParam(o.campaign),
      ref: cleanRef(o.ref),
    };
  } catch {
    return null;
  }
}
