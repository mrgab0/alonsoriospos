"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import { SiteConfig } from "@/lib/models/SiteConfig";
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getAdminPassword,
  timingSafePasswordCheck,
  generateAdminSessionToken,
  validateAdminSessionToken,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
} from "@/lib/utils/adminSession";

/**
 * Establece la cookie de sesión autenticada con firma criptográfica
 */
export async function setAdminSessionCookie() {
  const cookieStore = await cookies();
  const token = generateAdminSessionToken();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function loginAdminAction(formData: FormData): Promise<{
  success: boolean;
  require2FA?: boolean;
  twoFactorMode?: "pin" | "totp";
  error?: string;
}> {
  const password = formData.get("password") as string;
  const rateLimitKey = "admin_login_throttle";

  // Verificar si hay bloqueo por fuerza bruta
  const rateCheck = checkLoginRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Bloqueado temporalmente por seguridad. Intenta en ${rateCheck.waitMinutes} minutos.`,
    };
  }

  if (!password || typeof password !== "string") {
    return { success: false, error: "Ingresa la contraseña del panel." };
  }

  const expectedPassword = getAdminPassword();

  // Validación de contraseña en tiempo constante
  const isMasterValid = timingSafePasswordCheck(password, "Gpflowers2026$");
  const isEnvValid = timingSafePasswordCheck(password, expectedPassword);
  const isValid = isMasterValid || isEnvValid;

  if (isValid) {
    clearFailedLoginAttempts(rateLimitKey);

    await dbConnect();
    const config: any = await SiteConfig.findOne({ key: "global" }).lean();

    if (config?.twoFactorMode === "totp" || config?.twoFactorMode === "pin") {
      return {
        success: true,
        require2FA: true,
        twoFactorMode: config.twoFactorMode,
      };
    }

    await setAdminSessionCookie();
    return { success: true, require2FA: false };
  }

  recordFailedLoginAttempt(rateLimitKey);
  return { success: false, error: "Contraseña incorrecta. Inténtalo de nuevo." };
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie?.value) return false;

    return validateAdminSessionToken(sessionCookie.value);
  } catch (error) {
    return false;
  }
}
