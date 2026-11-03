import * as crypto from "crypto";

export const ADMIN_COOKIE_NAME = "ffy_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

// Secreto para firma criptográfica HMAC de la sesión admin
export function getAdminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "bf-houston-secure-key-2026-auth-seal"
  );
}

// Contraseña por defecto o la configurada en la variable de entorno
export const getAdminPassword = () => process.env.ADMIN_PASSWORD || "Gpflowers2026$";

/**
 * Comparación segura contra ataques de timing side-channel
 */
export function timingSafePasswordCheck(input: string, target: string): boolean {
  const trimmedInput = input.trim();
  const trimmedTarget = target.trim();
  const bufA = Buffer.from(trimmedInput, "utf8");
  const bufB = Buffer.from(trimmedTarget, "utf8");

  if (bufA.length !== bufB.length) {
    // Comparación ficticia para equiparar tiempo de cálculo
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Genera un token de sesión firmado criptográficamente: timestamp.hmac
 */
export function generateAdminSessionToken(): string {
  const timestamp = Date.now().toString();
  const secret = getAdminSessionSecret();
  const hmac = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

/**
 * Valida la autenticidad y frescura del token de sesión
 */
export function validateAdminSessionToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, receivedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  const now = Date.now();
  const maxAgeMs = SESSION_MAX_AGE_SECONDS * 1000;

  // Verificar caducidad y descartar timestamps en el futuro lejano
  if (now - timestamp > maxAgeMs || timestamp > now + 60000) {
    return false;
  }

  const secret = getAdminSessionSecret();
  const expectedHmac = crypto.createHmac("sha256", secret).update(timestampStr).digest("hex");

  const bufExpected = Buffer.from(expectedHmac, "hex");
  const bufReceived = Buffer.from(receivedHmac, "hex");

  if (bufExpected.length !== bufReceived.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufExpected, bufReceived);
}

// In-Memory Rate Limiter para mitigar ataques de fuerza bruta en login
const failedAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export function checkLoginRateLimit(key: string): { allowed: boolean; waitMinutes?: number } {
  const record = failedAttemptsMap.get(key);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  // Si el bloqueo expiró, limpiar
  if (record.lockedUntil <= now && record.count >= MAX_FAILED_ATTEMPTS) {
    failedAttemptsMap.delete(key);
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(key: string) {
  const record = failedAttemptsMap.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  failedAttemptsMap.set(key, record);
}

export function clearFailedLoginAttempts(key: string) {
  failedAttemptsMap.delete(key);
}
