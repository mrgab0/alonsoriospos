import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { getSiteConfig } from '@/lib/actions/siteConfig';
import { getDeliveryOptions } from '@/lib/actions/delivery';
import { verifyAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// Limitador de tasa por IP: máximo 25 mensajes por minuto para blindar cuota de Gemini
const chatRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const CHAT_MAX_PER_MINUTE = 25;
const CHAT_WINDOW_MS = 60 * 1000;

function checkChatRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = chatRateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    chatRateLimitMap.set(ip, { count: 1, resetAt: now + CHAT_WINDOW_MS });
    return true;
  }
  if (entry.count >= CHAT_MAX_PER_MINUTE) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  let clientContext: any = null;
  try {
    const body = await req.json();
    clientContext = body?.clientContext;
    const { messages, locale = 'es' } = body;
    const isEn = locale === 'en';

    // Protección de tasa (Rate Limiting)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkChatRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error: isEn
            ? "Too many chat messages. Please wait a moment."
            : "Has enviado demasiados mensajes seguidos. Por favor espera un momento.",
        },
        { status: 429 }
      );
    }

    // Privilegios de administrador verificados criptográficamente
    const isAdmin = Boolean(clientContext?.isAdmin) && (await verifyAdminSession());

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        error: isEn ? "No valid messages provided." : "No se proporcionaron mensajes válidos." 
      }, { status: 400 });
    }

    if (messages.length > 25) {
      return NextResponse.json({
        error: isEn ? "Message history too long." : "Historial de conversación demasiado extenso."
      }, { status: 400 });
    }

    const customerName = clientContext?.customerName?.toString()?.trim();
    const lastOrderId = clientContext?.lastOrderId?.toString()?.trim();

    const clientContextSnippet = (customerName || lastOrderId)
      ? (isEn
          ? `\nReturning Customer Context:\n${customerName ? `- Customer Name: ${customerName}\n` : ''}${lastOrderId ? `- Last Known Order ID: ${lastOrderId}\n` : ''}- Note: If greeting or welcoming the customer, you may address them warmly by name (e.g. "Hi again, ${customerName}! 🌸"). Only reference the order ID if they ask about tracking or their previous order.\n`
          : `\nContexto de Cliente Recurrente:\n${customerName ? `- Nombre del cliente: ${customerName}\n` : ''}${lastOrderId ? `- Último pedido registrado: ${lastOrderId}\n` : ''}- Nota: Si saludas o das la bienvenida al cliente, puedes llamarlo cordialmente por su nombre (ej: "¡Hola de nuevo, ${customerName}! 🌸"). Solo haz referencia al ID de orden si pregunta por su pedido o rastreo.\n`)
      : '';

    // 1. Obtener catálogo, opciones de entrega y configuración de la tienda para nutrir el contexto
    await dbConnect();
    const [products, deliveryRes, { data: siteConfig }] = await Promise.all([
      Product.find({ isActive: { $ne: false } })
        .select('_id name price slug images category description flowerType badge')
        .limit(40)
        .lean(),
      getDeliveryOptions(),
      getSiteConfig()
    ]);

    const apiKey = (
      siteConfig?.geminiApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
    )?.trim();

    const productCatalogSummary = (products && products.length > 0)
      ? products.map((p: any) => `- "${p.name}" ($${p.price} USD) | Enlace: /productos/${p.slug} | Categoría: ${p.category || 'General'}`).join('\n')
      : (isEn ? "There are currently no products listed in the online catalog." : "No hay productos listados actualmente en el catálogo online.");

    const deliveryOptionsSummary = (deliveryRes?.data && deliveryRes.data.length > 0)
      ? deliveryRes.data.map((d: any) => `- ${d.title}: $${d.pricePerMile}/milla (${d.estimatedTimeLabel})`).join('\n')
      : "- Same-Day Delivery across Houston, TX and metropolitan areas.";

    const whatsappPhone = "+1 346 739 2730";
    const whatsappUrl = "https://wa.me/13467392730";
    const storeAddress = siteConfig?.businessAddress || "Houston, TX";

    // 2. Definir instrucciones de sistema precisas según idioma y rol (Tienda vs Admin Co-Pilot)
    const adminSystemPrompt = `Eres "Flor Co-Pilot", el copiloto inteligente de inteligencia artificial para la administración de "Bonbon Flowers Houston" (bonbonflowershouston.com).
Tu rol es asistir a los dueños, floristas y administradores de la tienda en el panel de control.

Módulos del Administrador y Enlaces Directos:
1. Órdenes & Despacho: [Gestor de Órdenes](/admin/ordenes)
   - Estados de órdenes (Pendiente, En Preparación, En Ruta, Entregado, Cancelado).
   - Ver detalles del cliente, dedicatoria de la tarjeta, fotos de confirmación antes de la entrega y chofer asignado.
2. Catálogo de Arreglos: [Gestionar Productos](/admin/productos)
   - Crear nuevos ramos, editar precios, subir fotos a ImageKit, asignar categorías y badges (Bestseller, Oferta, etc.).
3. Adicionales y Variantes: [Gestionar Adicionales](/admin/adicionales)
   - Adicionales: Peluches, globos de helio, chocolates, coronas y lazos dorados.
   - Variantes anidadas: Los productos secundarios (ej. 75 rosas, 100 rosas) se anidan bajo un producto padre (ej. 50 rosas). Al anidarse, las variantes quedan agrupadas bajo el padre y se seleccionan en la ficha de producto sin saturar la página principal.
4. Tarifas de Entrega: [Opciones de Entrega](/admin/entregas)
   - Configuración de costo por milla en Houston (cobro por milla recorrida sin precio base: River Oaks, Galleria, Katy, The Woodlands, Downtown, Pearland, Cypress, Sugar Land).
   - Recogida en tienda (Pickup) gratuita ($0.00).
5. Métricas y Recuperación: [Estadísticas & Carritos](/admin/estadisticas)
   - Resumen de ingresos, tasa de conversión y carritos abandonados con botón de contacto directo por WhatsApp.
6. Banners de Campañas: [Gestionar Banners](/admin/sliders)
   - Banners del carrusel para San Valentín, Día de las Madres, Graduaciones o Aniversarios.
7. Cupones de Descuento: [Cupones de Descuento](/admin/cupones)
   - Creación de códigos promocionales con límites de uso, descuentos porcentuales o de monto fijo.
8. Pasarelas de Pago: [Cuentas de Pago & QR](/admin/pagos)
   - Zelle Houston, Square, Stripe, Apple Pay y Códigos QR de pago rápido.
9. Optimización SEO: [Optimización SEO](/admin/seo)
   - Keywords para floristerías de lujo Houston, meta etiquetas, OpenGraph para redes sociales y descripciones indexables.
10. Configuración del Taller: [Configuración](/admin/configuracion)
    - Autenticación en dos pasos (2FA), lemas predeterminados para cintas de satén ("Happy Birthday", "Te Amo", "Para la más bella") y avisos de la tienda.
11. Correos, Webmail & Captador de Leads: [Correos & Webmail](/admin/correos)
    - Webmail estilo Gmail: Bandeja de entrada, enviados, carritos abandonados con recuperación en 1 clic, suscriptores y campañas masivas.
    - Widget Flotante de Captación de Leads: Píldora de champagne ('champagne_pill'), modal de terciopelo ('velvet_modal') o tarjeta lateral ('corner_toast') para capturar correos de nuevos visitantes a cambio de un cupón.
    - Asistencia Creativa: Si el administrador te pide crear o configurar la plantilla del widget flotante de captación de leads, propón una estrategia completa con: Plantilla recomendada, Título del Gancho, Subtítulo persuasivo, Código de Cupón sugerido y Tiempo de espera (en segundos).

Reglas de Comportamiento Co-Pilot:
1. Responde de forma clara, directa, profesional y amable (máximo 2 a 3 párrafos concisos).
2. Incluye SIEMPRE enlaces de markdown útiles a los módulos correspondientes (ej: [Gestionar Productos](/admin/productos)).
3. Si el administrador pide ideas de copywriting para un arreglo, sugerencias de precios, o estrategias para promociones de temporada, redacta propuestas de alta conversión y estilo de lujo.
4. Siempre termina todas tus frases de forma completa y con puntuación adecuada.`;

    const systemPrompt = isEn
      ? `You are "Flor", the friendly, elegant, and expert floral advisor at "Bonbon Flowers Houston" in Houston, Texas (bonbonflowershouston.com).
Your goal is to assist customers naturally via mobile chat just like a real, helpful florist on WhatsApp.
${clientContextSnippet}
Full Business & Website Knowledge:
- Website Sections & Links:
  * Contact & Email: [Contact Page](/contacto) (direct web form to send emails and inquiries to our florists).
  * WhatsApp & Phone: [📲 WhatsApp (${whatsappPhone})](${whatsappUrl}) or call ${whatsappPhone}.
  * Flower Catalog: [Flower Catalog](/productos) (luxury rose bouquets, buchón bouquets, luxury boxes, orchids, anniversary/birthday arrangements).
  * Order Tracking: [Track My Order](/rastreo) (customers can check live order status using their Order ID or their phone number).
  * About Us & Floral Blog: [About Us & Blog](/nosotros) (our story, flower care guides, and floral tips).
  * Checkout & Payment: [Cart & Checkout](/checkout) (we accept Zelle, Square, Visa, Mastercard, Amex, Discover, and In-Store Pickup).
- Physical Boutique / Pickup:
  * Address: ${storeAddress}.
  * Boutique Pickup is $0.00 (FREE).
- Delivery Logistics:
  * Same-day delivery in Houston, TX, Pearland, Katy, Sugar Land, and metropolitan areas.
  * Delivery fee is automatically calculated at [Checkout](/checkout) based on distance in miles ($Base + $Per Mile).
  * Delivery Options:
${deliveryOptionsSummary}

Available Flower Catalog:
${productCatalogSummary}

Conversational Guidelines (STRICT):
1. Be concise, warm, natural, and human. Write like a real person messaging on WhatsApp (1 to 2 short sentences per turn, maximum 3).
2. If the customer asks how to contact via email, form, or message, warmly point them to the [Contact Page](/contacto) and offer [📲 WhatsApp](${whatsappUrl}) for instant replies.
3. If the customer asks about order status or tracking, guide them to [Track My Order](/rastreo) with their Order ID or phone number.
4. If the customer asks about delivery costs, explain that delivery is calculated by distance at [Checkout](/checkout), with free pickup in ${storeAddress}.
5. If the customer greets you or makes a general comment, greet back warmly with a single helpful question (e.g. "Hi! 🌸 What special occasion are you looking for flowers for today?"). Do NOT dump catalog links immediately on a simple greeting.
6. PRODUCT RECOMMENDATIONS: When a customer asks for recommendations for any occasion (admirer, anniversary, birthday, romance, luxury roses, etc.), ALWAYS suggest 1 to 3 real products from the catalog above with their exact markdown link: [Product Name](/productos/slug) ($XX USD).
7. At the very end of your response, add the product tag for each suggested product: [[PRODUCT:slug]]. This activates interactive product cards with photos and 'Add to Cart' buttons in the chat UI!
8. Only include the WhatsApp link ([📲 WhatsApp](${whatsappUrl})) when the customer asks for custom flowers, needs phone assistance, or is ready to place a custom order.
9. Use tasteful floral emojis sparingly (🌸, 🌹, ✨). Never sound robotic or formal.
10. Completeness: ALWAYS complete all sentences and thoughts properly with punctuation. NEVER leave a sentence half-cut or truncated.`
      : `Eres "Flor", la asesora floral experta, cálida y amigable de "Bonbon Flowers Houston" en Houston, Texas (bonbonflowershouston.com).
Tu objetivo es asesorar a los clientes de forma 100% natural, cercana y humana, exactamente como una florista real atendiendo por WhatsApp.
${clientContextSnippet}
Conocimiento Completo del Sitio Web y Negocio:
- Secciones y Enlaces de la Web:
  * Contacto y Email: [Página de Contacto](/contacto) (formulario web directo para enviar correos electrónicos y mensajes al equipo floral).
  * WhatsApp y Teléfono: [📲 WhatsApp (${whatsappPhone})](${whatsappUrl}) o llamar al ${whatsappPhone}.
  * Catálogo de Flores: [Catálogo de Flores](/productos) (ramos buchones, rosas de exportación, cajas de lujo, orquídeas, aniversarios, cumpleaños).
  * Rastreo de Pedidos: [Rastrear Mi Envío](/rastreo) (los clientes consultan el estado en vivo con su ID de orden o su número de teléfono).
  * Nosotros y Blog Floral: [Nosotros & Consejos](/nosotros) (nuestra historia boutique, guías de cuidado de flores y tendencias).
  * Carrito y Pago: [Carrito & Checkout](/checkout) (aceptamos Zelle, Square, tarjetas de crédito/débito Visa/Mastercard/Amex y retiro en tienda).
- Boutique Física y Retiro:
  * Dirección: ${storeAddress}.
  * Retiro en Boutique (Pickup) es $0.00 (Gratis).
- Envíos y Delivery:
  * Entregas el mismo día en Houston, Pearland, Katy, Sugar Land y áreas metropolitanas.
  * La tarifa se calcula automáticamente en el [Checkout](/checkout) según la distancia en millas (Tarifa Base + Millas).
  * Modalidades de entrega:
${deliveryOptionsSummary}

Catálogo de productos disponible:
${productCatalogSummary}

Reglas estrictas de conversación humana y corta:
1. Responde SIEMPRE de forma concisa, cálida y directa (1 a 2 oraciones cortas por mensaje, máximo 3). Escribe como una persona real en chat de WhatsApp.
2. Si el cliente pregunta cómo contactar por email, correo o formulario, dile con cariño que puede hacerlo a través de la página de [Contacto](/contacto) o por [📲 WhatsApp](${whatsappUrl}) si desea respuesta inmediata.
3. Si el cliente pregunta por el estado de su pedido o cómo rastrearlo, guíalo a [Rastrear Mi Envío](/rastreo) indicándole que use su ID de orden o número de teléfono.
4. Si el cliente pregunta por costos de envío o delivery, explícale que se calcula en el [Checkout](/checkout) según las millas, y que el retiro en tienda (${storeAddress}) es gratis.
5. Si el cliente solo te saluda o hace un comentario breve, salúdalo con cariño y hazle una sola pregunta sencilla para guiarlo (ej: "¡Hola! 🌸 Qué gusto saludarte. ¿Para qué ocasión especial buscas flores hoy?"). NUNCA envíes enlaces de golpe en un saludo inicial.
6. RECOMENDACIÓN DE PRODUCTOS: Cuando el cliente pida sugerencias para una ocasión (admiradora, aniversario, cumpleaños, perdón, romance, etc.), DEBES recomendar de 1 a 3 productos REALES del catálogo con su enlace exacto: [Nombre del Arreglo](/productos/slug) ($XX USD). NUNCA inventes nombres que no existan en el catálogo.
7. Al final de tu mensaje, añade la etiqueta para cada producto que recomiendes: [[PRODUCT:slug]]. Esto activará de forma automática tarjetas visuales con su foto real y el botón interactivo de 'Añadir al Carrito' en la ventana de chat!
8. Incluye el enlace de WhatsApp ([📲 WhatsApp](${whatsappUrl})) cuando el cliente pida un diseño personalizado fuera del catálogo, pregunte por teléfono o necesite atención inmediata de un florista.
9. Usa emojis florales con moderación y buen gusto (🌸, 🌹, ✨). No uses lenguaje robótico ni párrafos largos.
10. Mensajes Completos: Completa SIEMPRE todas tus oraciones y pensamientos con su punto final. NUNCA dejes frases a medias o palabras cortadas.`;

    const effectiveSystemPrompt = isAdmin ? adminSystemPrompt : systemPrompt;

    // Si no hay API key configurada, responder con un mensaje acorde al rol
    if (!apiKey) {
      if (isAdmin) {
        return NextResponse.json({
          text: `⚡ **Flor Co-Pilot (Sin Clave de Gemini Detectada)**\n\nNo se encontró una clave de Gemini configurada en Vercel (\`GEMINI_API_KEY\`) ni en la base de datos de la tienda.\n\n👉 **Para activar respuestas con IA en tiempo real:**\n1. Ve a [Configuración > Chatbot](/admin/configuracion).\n2. Pega tu clave de [Google AI Studio](https://aistudio.google.com) (\`AIzaSy...\`) y presiona Guardar.\n\n🛠️ **Enlaces directos de administración:**\n- [📦 Gestión de Productos](/admin/productos)\n- [🛍️ Gestor de Órdenes](/admin/ordenes)\n- [✨ Adicionales & Variantes](/admin/adicionales)\n- [🚚 Opciones de Entrega](/admin/entregas)\n- [📈 Estadísticas & Métricas](/admin/estadisticas)`
        });
      }
      if (isEn) {
        return NextResponse.json({
          text: `🌸 Hello! I'm **Flor**, your floral advisor at *Bonbon Flowers Houston* (Houston, TX). What special occasion are you looking for flowers for today? ✨`
        });
      }
      return NextResponse.json({
        text: `🌸 ¡Hola! Soy **Flor**, tu asesora floral de *Bonbon Flowers Houston* en Houston, TX. ¿Para qué ocasión especial estás buscando flores hoy? ✨`
      });
    }

    // 3. Formatear historial de conversación para Gemini API con sanitización de longitud
    const formattedContents = messages
      .filter((m: any) => m && typeof m.text === 'string' && m.text.trim())
      .map((m: { role: string; text: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text.slice(0, 1500) }]
      }));

    // 4. Llamar a la API de Gemini con modelos oficiales de alta velocidad y Free Tier
    const modelsToTry = [
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite'
    ];
    let aiResponseText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              parts: [{ text: effectiveSystemPrompt }]
            },
            generationConfig: {
              temperature: 0.65,
              topP: 0.9,
              maxOutputTokens: 1024
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates.length > 0 && data.candidates[0].content?.parts?.length > 0) {
            aiResponseText = data.candidates[0].content.parts[0].text;
            break;
          }
        } else {
          const errData = await response.text();
          console.warn(`Intento con modelo ${model} falló (${response.status}):`, errData);
          lastError = { status: response.status, body: errData, model };
        }
      } catch (err) {
        console.warn(`Error de conexión con modelo ${model}:`, err);
        lastError = err;
      }
    }

    if (!aiResponseText) {
      if (isAdmin) {
        let errorDetail = "";
        if (lastError?.body) {
          try {
            const parsed = JSON.parse(lastError.body);
            errorDetail = parsed.error?.message || lastError.body;
          } catch {
            errorDetail = typeof lastError.body === "string" ? lastError.body : JSON.stringify(lastError.body);
          }
        } else if (lastError?.message) {
          errorDetail = lastError.message;
        }

        return NextResponse.json({
          text: `⚠️ **Aviso de Google Gemini API:** ${errorDetail ? `\`${errorDetail}\`` : "No se pudo obtener respuesta del modelo de IA"}.

👉 **Diagnóstico para el Administrador:**
1. Si tu clave da error de \`PERMISSION_DENIED\` o \`SERVICE_DISABLED\`, asegúrate de habilitar la **Generative Language API** en Google Cloud o crear una clave limpia desde [Google AI Studio (aistudio.google.com)](https://aistudio.google.com).
2. Puedes ingresar tu clave directamente en [Configuración > Chatbot](/admin/configuracion) sin necesidad de redeployar en Vercel.

🛠️ **Navegación directa:**
- [📦 Gestionar Productos](/admin/productos)
- [🛍️ Gestor de Órdenes](/admin/ordenes)
- [✨ Adicionales & Variantes](/admin/adicionales)
- [🚚 Opciones de Entrega](/admin/entregas)`
        });
      }

      if (isEn) {
        return NextResponse.json({
          text: `🌸 Hello! I'd be happy to assist you. You can browse all our arrangements in the [Flower Catalog](/productos) or reach out directly on [📲 WhatsApp (${whatsappPhone})](${whatsappUrl}) to place your order right away. ✨`
        });
      }
      return NextResponse.json({
        text: `🌸 ¡Hola! Con mucho gusto te asesoro. Puedes ver todos nuestros arreglos en el [Catálogo de Flores](/productos) o contactarnos directo por [📲 WhatsApp (${whatsappPhone})](${whatsappUrl}) para tomar tu pedido de inmediato. ✨`
      });
    }

    // Extracción de productos sugeridos con fotos, slugs, precios y IDs
    const suggestedProducts: Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      image: string;
    }> = [];

    const addedSlugs = new Set<string>();

    const addProductIfFound = (found: any) => {
      if (found && !addedSlugs.has(found.slug)) {
        addedSlugs.add(found.slug);
        suggestedProducts.push({
          id: found._id ? found._id.toString() : found.slug,
          name: found.name,
          slug: found.slug,
          price: found.price,
          image: (found.images && found.images.length > 0)
            ? found.images[0]
            : 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=500&q=80'
        });
      }
    };

    // 1. Detección por etiquetas [[PRODUCT:slug]]
    const tagMatches = Array.from(aiResponseText.matchAll(/\[\[PRODUCT:([a-zA-Z0-9_-]+)\]\]/gi));
    for (const match of tagMatches) {
      const slug = match[1]?.toLowerCase();
      const found = (products as any[]).find((p) => p.slug?.toLowerCase() === slug);
      if (found) addProductIfFound(found);
    }

    // 2. Detección por enlaces markdown /productos/slug
    const urlMatches = Array.from(aiResponseText.matchAll(/\/productos\/([a-zA-Z0-9_-]+)/gi));
    for (const match of urlMatches) {
      const slug = match[1]?.toLowerCase();
      const found = (products as any[]).find((p) => p.slug?.toLowerCase() === slug);
      if (found) addProductIfFound(found);
    }

    // 3. Fallback inteligente: si se mencionan títulos exactos de arreglos en el texto
    if (suggestedProducts.length === 0) {
      for (const p of (products as any[])) {
        if (p.name && p.name.length > 4 && aiResponseText.toLowerCase().includes(p.name.toLowerCase())) {
          addProductIfFound(p);
          if (suggestedProducts.length >= 3) break;
        }
      }
    }

    // Limpiar las etiquetas técnicas [[PRODUCT:...]] para que el texto visual quede impecable
    const cleanText = aiResponseText.replace(/\[\[PRODUCT:[a-zA-Z0-9_-]+\]\]/gi, '').trim();

    return NextResponse.json({
      text: cleanText,
      products: suggestedProducts
    });

  } catch (error: any) {
    console.error("Error en Chatbot API:", error);
    if (clientContext?.isAdmin) {
      return NextResponse.json({
        text: `⚠️ **Error en Chatbot API:** ${error?.message || "Error procesando solicitud"}. Puedes gestionar tus [Productos](/admin/productos) u [Órdenes](/admin/ordenes).`
      }, { status: 200 });
    }
    return NextResponse.json({
      text: "🌸 Con mucho gusto te ayudamos / We're happy to help. Puedes explorar nuestros ramos en el [Catálogo de Flores / Catalog](/productos) o escribirnos directo a [📲 WhatsApp (+1 346 739 2730)](https://wa.me/13467392730) para atenderte en tiempo real."
    }, { status: 200 });
  }
}
