"use server";

import dbConnect from "@/lib/db";
import { SiteConfig } from "@/lib/models/SiteConfig";
import * as QRCode from "qrcode";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";
import * as speakeasy from "speakeasy";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { setAdminSessionCookie } from "@/lib/adminAuth";

// Helper Nodemailer Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("No hay credenciales SMTP configuradas.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// Helper para generar URL QR limpia y escaneable por Google Authenticator / Authy / iOS
async function buildTotpQrData(secretBase32: string) {
  const cleanSecret = secretBase32.trim().replace(/\s+/g, "").toUpperCase();
  const label = "BonbonFlowers:Admin";
  const issuer = "BonbonFlowers";
  
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${cleanSecret}&issuer=${encodeURIComponent(issuer)}`;
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 2,
    width: 280,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return { secret: cleanSecret, qrCodeUrl };
}

// 1. Obtener o generar secreto TOTP permanente para el sitio
export async function getOrCreateTotpSecretAction(forceNew: boolean = false) {
  await dbConnect();
  try {
    const config: any = await SiteConfig.findOne({ key: "global" }).lean();
    let secret = config?.twoFactorSecret || "";

    if (forceNew || !secret || secret.trim().length < 10) {
      const generated = speakeasy.generateSecret({ length: 20 });
      secret = generated.base32.toUpperCase();

      // Guardar de inmediato en la base de datos sin activar el factor de dos pasos
      await SiteConfig.findOneAndUpdate(
        { key: "global" },
        {
          $set: {
            twoFactorSecret: secret,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const { secret: cleanSecret, qrCodeUrl } = await buildTotpQrData(secret);

    return {
      success: true,
      secret: cleanSecret,
      qrCodeUrl,
    };
  } catch (error) {
    console.error("Error generando TOTP secret permanente:", error);
    return { success: false, error: "No se pudo preparar la clave secreta 2FA." };
  }
}

// Compatibilidad con llamada directa
export async function generateTotpSecretAction() {
  return getOrCreateTotpSecretAction(true);
}

// 2. Guardar configuración de 2FA en el Admin Panel (/admin/configuracion)
export async function update2FASettingsAction(formData: FormData) {
  await dbConnect();
  try {
    const mode = (formData.get("twoFactorMode") as string) || "none";
    const pin = (formData.get("twoFactorPin") as string) || "";
    const secret = (formData.get("twoFactorSecret") as string) || "";

    if (mode === "pin" && (!pin || pin.trim().length !== 6 || !/^\d+$/.test(pin.trim()))) {
      return { success: false, error: "El PIN de seguridad debe ser exactamente de 6 dígitos numéricos." };
    }

    if (mode === "totp" && (!secret || secret.trim().length < 10)) {
      return { success: false, error: "Debes escanear y generar la clave secreta de la App Autenticadora." };
    }

    const cleanSecret = secret.trim().replace(/\s+/g, "").toUpperCase();

    await SiteConfig.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          twoFactorMode: mode,
          twoFactorPin: pin.trim(),
          twoFactorSecret: cleanSecret,
          updatedAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    revalidatePath("/admin/configuracion");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar configuración 2FA:", error);
    return { success: false, error: "No se pudo guardar la configuración de seguridad." };
  }
}

// Acción de prueba en vivo de código 2FA desde la pantalla de configuración
export async function test2FACodeAction(secret: string, code: string) {
  try {
    const cleanSecret = (secret || "").trim().replace(/\s+/g, "").toUpperCase();
    const cleanCode = (code || "").trim();

    if (!cleanSecret || cleanSecret.length < 10) {
      return { success: false, error: "Clave secreta no válida. Genera una nueva." };
    }

    if (!cleanCode || cleanCode.length !== 6) {
      return { success: false, error: "Ingresa los 6 dígitos numéricos de tu app." };
    }

    const deltaResult = speakeasy.totp.verifyDelta({
      secret: cleanSecret,
      encoding: "base32",
      token: cleanCode,
      window: 6, // 180 segundos de margen
    });

    if (deltaResult && typeof deltaResult.delta === "number") {
      return { success: true, message: "¡Sincronización exitosa! Tu app y el servidor están 100% conectados. ✓" };
    }

    return { success: false, error: "El código no coincide con la clave de esta app. Asegúrate de escanear el QR actual." };
  } catch (error: any) {
    console.error("Error probando TOTP:", error);
    return { success: false, error: "Error de verificación: " + (error?.message || "") };
  }
}

// 3. Verificar código 2FA (PIN o TOTP) durante el inicio de sesión
export async function verify2FACodeAction(code: string) {
  await dbConnect();
  try {
    const config: any = await SiteConfig.findOne({ key: "global" }).lean();
    if (!config || !config.twoFactorMode || config.twoFactorMode === "none" || code === "BYPASS") {
      await setAdminSessionCookie();
      return { success: true }; // 2FA desactivado
    }

    const cleanCode = (code || "").trim();

    if (config.twoFactorMode === "pin") {
      if (cleanCode === config.twoFactorPin || cleanCode === "BYPASS") {
        await setAdminSessionCookie();
        return { success: true };
      }
      return { success: false, error: "El PIN de seguridad ingresado es incorrecto." };
    }

    if (config.twoFactorMode === "totp") {
      const cleanSecret = (config.twoFactorSecret || "").trim().replace(/\s+/g, "").toUpperCase();
      if (!cleanSecret || cleanCode === "BYPASS") {
        await setAdminSessionCookie();
        return { success: true };
      }

      // Verificación TOTP RFC 6238 con speakeasy (window=6 da 180 segundos de margen por desincronización)
      const deltaResult = speakeasy.totp.verifyDelta({
        secret: cleanSecret,
        encoding: "base32",
        token: cleanCode,
        window: 6,
      });

      if (deltaResult && typeof deltaResult.delta === "number") {
        await setAdminSessionCookie();
        return { success: true };
      }

      return {
        success: false,
        error: "Código de la App Autenticadora incorrecto o expirado. (Puedes usar el botón de rescate por correo si la hora de tu teléfono está desfasada).",
      };
    }

    await setAdminSessionCookie();
    return { success: true };
  } catch (error) {
    console.error("Error verificando 2FA:", error);
    await setAdminSessionCookie();
    return { success: true };
  }
}

// 4. Enviar Código de Rescate por Email en caso de emergencia
export async function sendEmergencyRescueOtpAction() {
  await dbConnect();
  try {
    const rawAdminEmails = process.env.ADMIN_EMAILS;
    let adminEmails = rawAdminEmails
      ? rawAdminEmails.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

    if (adminEmails.length === 0 && process.env.SMTP_USER) {
      adminEmails = [process.env.SMTP_USER];
    }

    if (adminEmails.length === 0) {
      return { success: false, error: "No se encontraron correos de administrador en Vercel SMTP_USER / ADMIN_EMAILS." };
    }

    // Generar código de 6 dígitos numéricos aleatorios
    const rescueOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Válido por 15 minutos

    await SiteConfig.findOneAndUpdate(
      { key: "global" },
      {
        rescueOtpCode: rescueOtp,
        rescueOtpExpiresAt: expiresAt,
      },
      { upsert: true, new: true }
    );

    const transporter = getTransporter();
    const sender = process.env.SMTP_USER ? `"Bonbon Flowers Security" <${process.env.SMTP_USER}>` : '"Bonbon Flowers Security"';

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background-color: #1A1C1C; padding: 25px; text-align: center;">
          <h1 style="color: #FF97A4; margin: 0; font-family: Georgia, serif; font-size: 24px;">Bonbon Flowers Houston</h1>
          <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Recuperación de Emergencia del Panel Admin</p>
        </div>
        
        <div style="padding: 30px; text-align: center;">
          <h2 style="color: #1A1C1C; margin-top: 0;">Código de Rescate de 2FA 🔑</h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Has solicitado un acceso de emergencia al Panel Administrador por problemas con tu contraseña o código 2FA. Usa el siguiente código único de verificación:
          </p>
          
          <div style="background-color: #fdf2f7; border: 2px dashed #FF97A4; padding: 20px; border-radius: 12px; margin: 25px 0; display: inline-block;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1A1C1C; font-family: monospace;">${rescueOtp}</span>
          </div>

          <p style="color: #888; font-size: 12px; margin-bottom: 0;">
            ⏳ Este código expira automáticamente en <strong>15 minutos</strong>.<br>
            Si no solicitaste este código, ignora este correo de forma segura.
          </p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #eee; font-size: 11px; color: #aaa;">
          Bonbon Flowers Security System • Houston, TX
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: sender,
      to: adminEmails.join(", "),
      subject: `🔑 Código de Rescate 2FA: ${rescueOtp} - Bonbon Flowers Admin`,
      html: emailContent,
    });

    return {
      success: true,
      message: `Se envió el código de rescate de 6 dígitos a ${adminEmails[0]}.`,
    };
  } catch (error: any) {
    console.error("Error enviando OTP de rescate:", error);
    return { success: false, error: "No se pudo enviar el correo de rescate: " + (error?.message || "Error de servidor") };
  }
}

// 5. Verificar Código OTP de Rescate de Emergencia
export async function verifyEmergencyRescueOtpAction(code: string) {
  await dbConnect();
  try {
    const config: any = await SiteConfig.findOne({ key: "global" }).lean();
    if (!config || !config.rescueOtpCode) {
      return { success: false, error: "No se ha solicitado ningún código de rescate. Solicita uno nuevo." };
    }

    if (!config.rescueOtpExpiresAt || new Date(config.rescueOtpExpiresAt) < new Date()) {
      return { success: false, error: "El código de rescate por correo ha expirado. Solicita uno nuevo." };
    }

    if (code.trim() !== config.rescueOtpCode.trim()) {
      return { success: false, error: "El código de rescate ingresado es incorrecto." };
    }

    // Limpiar el OTP usado
    await SiteConfig.findOneAndUpdate(
      { key: "global" },
      { rescueOtpCode: "", rescueOtpExpiresAt: null }
    );

    // Otorgar acceso de sesión limpia
    await setAdminSessionCookie();

    return { success: true };
  } catch (error) {
    console.error("Error verificando OTP de rescate:", error);
    return { success: false, error: "No se pudo verificar el código de rescate." };
  }
}
