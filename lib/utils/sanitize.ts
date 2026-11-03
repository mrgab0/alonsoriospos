/**
 * Utilidades de sanitización para prevención de NoSQL Injection y ReDoS (Regex Denial of Service).
 */

/**
 * Escapa caracteres especiales en strings destinados a expresiones regulares.
 * Previene ataques ReDoS y errores de sintaxis en consultas regex.
 */
export function escapeRegex(text: string): string {
  if (typeof text !== "string") return "";
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Sanitiza recursivamente objetos y valores provenientes del cliente
 * eliminando claves de operadores de MongoDB (claves que inician con '$' o contienen '.')
 */
export function sanitizeNoSql<T = any>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    // Si un valor de texto intenta pasar un operador MongoDB literal crudo
    return input.trim() as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeNoSql(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      // Bloquear claves con '$' (operadores como $gt, $where, $ne) o '.' (traversal de propiedades)
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      cleanObj[key] = sanitizeNoSql(val);
    }
    return cleanObj as T;
  }

  return input;
}

/**
 * Limpia y normaliza términos de búsqueda de usuarios con límite de longitud.
 */
export function sanitizeSearchTerm(term: unknown, maxLength: number = 80): string {
  if (typeof term !== "string") return "";
  return term.trim().slice(0, maxLength);
}
