/**
 * Utilidad de Búsqueda Semántica & Bilingüe (ES / EN) para el Catálogo de Bonbon Flowers
 * Soporta normalización de tildes/diacríticos y expansión de sinónimos para ocasiones florales.
 */

/**
 * Normaliza una cadena de texto eliminando tildes, mayúsculas y caracteres diacríticos.
 */
export function normalizeSearchText(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Diccionario de sinónimos bilingües y semánticos para ocasiones y productos florales.
 */
const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  // Cumpleaños / Birthday
  cumpleanos: ["cumplean", "birthday", "bday", "hb", "cumple"],
  cumplean: ["cumplean", "birthday", "bday", "hb", "cumple"],
  cumple: ["cumplean", "birthday", "bday", "hb", "cumple"],
  birthday: ["cumplean", "birthday", "bday", "hb", "cumple"],
  bday: ["cumplean", "birthday", "bday", "hb", "cumple"],

  // Graduación / Graduation
  graduacion: ["graduacion", "graduation", "grad", "grado"],
  graduation: ["graduacion", "graduation", "grad", "grado"],
  grad: ["graduacion", "graduation", "grad", "grado"],

  // Amor & Romance / Love & Romance
  romance: ["romance", "amor", "love", "valentin", "valentine", "enamorad", "pareja", "sweetheart", "blushing"],
  amor: ["romance", "amor", "love", "valentin", "valentine", "enamorad", "pareja", "sweetheart", "blushing"],
  love: ["romance", "amor", "love", "valentin", "valentine", "enamorad", "pareja", "sweetheart", "blushing"],
  valentin: ["romance", "amor", "love", "valentin", "valentine"],
  valentine: ["romance", "amor", "love", "valentin", "valentine"],

  // Aniversario / Anniversary
  aniversario: ["aniversario", "anniversary"],
  anniversary: ["aniversario", "anniversary"],

  // Flores: Rosas / Roses
  rosa: ["rosa", "rose"],
  rosas: ["rosa", "rose"],
  rose: ["rosa", "rose"],
  roses: ["rosa", "rose"],

  // Girasoles / Sunflowers
  girasol: ["girasol", "sunflower"],
  girasoles: ["girasol", "sunflower"],
  sunflower: ["girasol", "sunflower"],
  sunflowers: ["girasol", "sunflower"],

  // Tulipanes / Tulips
  tulipan: ["tulipan", "tulip"],
  tulipanes: ["tulipan", "tulip"],
  tulip: ["tulipan", "tulip"],
  tulips: ["tulipan", "tulip"],

  // Orquídeas / Orchids
  orquidea: ["orquidea", "orchid"],
  orquideas: ["orquidea", "orchid"],
  orchid: ["orquidea", "orchid"],
  orchids: ["orquidea", "orchid"],

  // Globos / Balloons / Helio / Helium
  globo: ["globo", "balloon", "helio", "helium"],
  globos: ["globo", "balloon", "helio", "helium"],
  balloon: ["globo", "balloon", "helio", "helium"],
  balloons: ["globo", "balloon", "helio", "helium"],
  helio: ["globo", "balloon", "helio", "helium"],
  helium: ["globo", "balloon", "helio", "helium"],

  // Peluches / Teddy Bears
  peluche: ["peluche", "teddy", "oso", "bear"],
  peluches: ["peluche", "teddy", "oso", "bear"],
  teddy: ["peluche", "teddy", "oso", "bear"],
  bear: ["peluche", "teddy", "oso", "bear"],
  oso: ["peluche", "teddy", "oso", "bear"],
  osos: ["peluche", "teddy", "oso", "bear"],

  // Chocolates & Dulces
  chocolate: ["chocolate", "ferrero", "dulce", "bombones", "bombon"],
  chocolates: ["chocolate", "ferrero", "dulce", "bombones", "bombon"],
  ferrero: ["chocolate", "ferrero", "dulce", "bombones", "bombon"],
  dulce: ["chocolate", "ferrero", "dulce", "bombones"],
  dulces: ["chocolate", "ferrero", "dulce", "bombones"],

  // Coronas & Joyas / Crowns
  corona: ["corona", "crown"],
  coronas: ["corona", "crown"],
  crown: ["corona", "crown"],
  crowns: ["corona", "crown"],
};

/**
 * Evalúa si un producto o adicional coincide con la consulta de búsqueda.
 * Indexa nombre, descripción, categorías, tipo de flor y etiquetas.
 */
export function matchesCatalogSearch(item: any, query: string): boolean {
  if (!query || !query.trim()) return true;

  const normalizedQuery = normalizeSearchText(query);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  // Recopilar conjunto de términos expandidos (sinónimos + palabras originales)
  const expandedTerms = new Set<string>();
  expandedTerms.add(normalizedQuery);

  for (const word of words) {
    expandedTerms.add(word);
    const synonyms = BILINGUAL_SYNONYMS[word];
    if (synonyms) {
      synonyms.forEach((s) => expandedTerms.add(s));
    }
  }

  // Construir pajar de búsqueda con todos los campos informativos del producto
  const haystack = normalizeSearchText(
    [
      item.name,
      item.category,
      item.displayCategory,
      item.flowerType,
      item.description,
      Array.isArray(item.tags) ? item.tags.join(" ") : item.tags,
      item.occasion,
      item.color,
      item.flowerColor,
    ]
      .filter(Boolean)
      .join(" ")
  );

  // 1. Coincidencia directa por cualquier término expandido
  for (const term of expandedTerms) {
    if (haystack.includes(term)) {
      return true;
    }
  }

  // 2. Coincidencia por todas las palabras ingresadas por el usuario
  return words.every((word) => haystack.includes(word));
}
