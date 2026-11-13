# VKA POS & ERP - Catálogo de Capturas de Pantalla para Defensa de Tesis

Este documento recopila las capturas de pantalla oficiales en alta resolución (1920x1080 Full HD) del sistema **VKA POS & ERP (Enterprise Cloud)**, preparadas para su inclusión en la memoria técnica y presentación formal ante el jurado evaluador universitario.

---

## 📸 Índice de Módulos y Evidencias Visuales

| # | Archivo | Módulo del Sistema | Descripción Técnica para la Tesis |
|---|---|---|---|
| **01** | [`01_dashboard_principal.png`](./01_dashboard_principal.png) | **Panel Ejecutivo & Métricas ERP** | Resumen gerencial en tiempo real: Ventas brutas diarias, margen de utilidad neta, ticket promedio, tasa oficial BCV / Paralelo, estado de liquidez de caja y gráficas horarias de rendimiento comercial. |
| **02** | [`02_terminal_pos_caja.png`](./02_terminal_pos_caja.png) | **Terminal POS Mostrador** | Punto de venta optimizado para pantallas táctiles y lectores de código de barra: Teclado numérico, selección de productos, cálculo automático de IVA (16%), IGTF (3%) y panel multipago (Efectivo, Pago Móvil, Zelle, Tarjeta, Fiado). |
| **03** | [`03_recepcion_compras_kardex.png`](./03_recepcion_compras_kardex.png) | **Recepción de Mercancía & Kardex** | Entrada de facturas de proveedores: Registro de lote, fecha de vencimiento, actualización automática de costo promedio ponderado en Kardex PEPS/FIFO y ajuste en tiempo real del inventario. |
| **04** | [`04_directorio_proveedores.png`](./04_directorio_proveedores.png) | **Directorio Comercial de Proveedores** | Gestión de proveedores de insumos (flores, bases, empaques): Ficha fiscal (RIF/NIT), días de crédito acordados, límite de crédito comercial, saldo pendiente y calificación de cumplimiento de entregas. |
| **05** | [`05_cuentas_por_pagar.png`](./05_cuentas_por_pagar.png) | **Cuentas por Pagar (CXP)** | Semáforo de vencimientos financieros: Control estricto de facturas a crédito por proveedor, alertas de mora (>30 días, >15 días, próximas a vencer) y programación de pagos bancarios. |
| **06** | [`06_cuentas_por_cobrar_fiados.png`](./06_cuentas_por_cobrar_fiados.png) | **Cuentas por Cobrar & Crédito Cliente (CXC)** | Gestión de fiados y cartera de clientes: Saldo global por cobrar, índice de rotación, historial de abonos parciales y liquidación por ticket de venta. |
| **07** | [`07_planes_financiamiento_cuotas.png`](./07_planes_financiamiento_cuotas.png) | **Financiamiento en Cuotas & Pagaré Legal** | Motor de amortización de créditos otorgados a clientes a cuotas fijas (semanal, quincenal, mensual). Generación y emisión automática de Pagaré Mercantil con validez jurídica y firma digital SHA-256. |
| **08** | [`08_flota_despacho_conductores.png`](./08_flota_despacho_conductores.png) | **Gestión de Flota & Despachos a Domicilio** | Sistema multivehicular de entrega (Bicicleta, Moto, Sedán, Furgoneta, Camión 350): Cotizador dinámico de tarifa de flete por kilometraje y asignación de motorizados con trazabilidad de entrega. |
| **09** | [`09_reloj_checador_asistencia_pin.png`](./09_reloj_checador_asistencia_pin.png) | **Reloj Checador Biométrico / PIN** | Terminal táctil de control horario laboral: Teclado numérico interactivo 0-9 para registro rápido de Entrada, Almuerzo y Fin de Turno, junto al tablero en vivo de puntualidad y horas efectivas por empleado. |
| **10** | [`10_nomina_sueldos_prestamos.png`](./10_nomina_sueldos_prestamos.png) | **Nómina de Sueldos & Préstamos al Personal** | Liquidación quincenal automatizada: Cálculo de sueldo base, bonos de puntualidad, comisiones por ventas en POS y deducción sistemática de amortización por préstamos directos concedidos a empleados. Emisión de ticket térmico oficial de pago (80mm). |
| **11** | [`11_tienda_retail_catalogo.png`](./11_tienda_retail_catalogo.png) | **Tienda Digital & Catálogo Retail** | Vitrina web de cara al consumidor final: Navegación por categorías de arreglos florales y regalos, control de stock disponible en tiempo real y flujo de compra integrado con el motor de inventario del ERP. |

---

## 🛠️ Especificaciones Técnicas del Sistema

- **Arquitectura**: Next.js App Router (Fullstack Server Components & Server Actions)
- **Lenguaje**: TypeScript (Strict Mode)
- **Base de Datos**: MongoDB Atlas con Mongoose ODM
- **Estilos & UI**: Tailwind CSS, diseño responsivo Dark/Slate Theme con acentos Emerald (#10b981)
- **Formato de Salida de Capturas**: PNG 1920x1080 (1080p Full HD) renderizado mediante Microsoft Edge Headless Engine.
