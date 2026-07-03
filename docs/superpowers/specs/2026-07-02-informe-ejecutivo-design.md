# Informe Ejecutivo — diseño

Fecha: 2026-07-02 · Proyecto: defa-conaf (ui) · Fase 1 del upgrade épico.

## Objetivo

Una vista nueva, grado presentación, que convierte los números del balance en un
informe ejecutivo narrado y exportable a PDF institucional. Une tres ejes: IA
(narrativa por reglas), rediseño visual (la pantalla misma) y funcionalidad nueva
(export PDF). No toca autenticación (fase de seguridad aparte).

## Alcance

Incluye:
- Motor de narrativa determinista (reglas, sin LLM).
- Pantalla `InformeEjecutivo` enganchada al sidebar y al command palette.
- Export a PDF vía hoja de estilo de impresión + `window.print()`.

No incluye (YAGNI): LLM/API externa, librería de PDF pesada, cambios en otras
vistas, cambios de login/auth, nuevas tablas en Supabase.

## Piezas

### 1. `src/lib/narrative.ts` (función pura, testeable)

`generateInforme(report: BalanceReport, history: HistoryEntry[]): Informe`

Reusa lo que ya existe en `analytics.ts`: `calcHealthScore`, `calcBurnForecast`,
`calcVariance`, `rankPrograms`. No recalcula matemática, la narra.

```ts
interface InformeSeccion {
  id: string;
  titulo: string;
  severidad: 'positivo' | 'neutral' | 'atencion' | 'critico';
  parrafo: string;
  bullets?: string[];
}
interface Informe {
  periodo: string;
  oficina: string;
  fechaGeneracion: string;
  veredicto: { label: string; color: string; score: number; titular: string };
  secciones: InformeSeccion[];
}
```

Secciones generadas:
1. Ejecución global — avance real vs esperado al mes actual, monto ejecutado y saldo.
2. Programas destacados — top adelantados y top en riesgo (retrasado / subejecución),
   derivados de `calcVariance` y `rankPrograms`.
3. Proyección de cierre — `calcBurnForecast`: proyección %, saldo proyectado, mes de
   agotamiento y riesgo de sobregiro.
4. Recomendaciones — bullets accionables según estados de varianza y alertas.

Formateo de montos CLP local a la función (helper pequeño, sin dependencias).

### 2. `src/components/conaf/InformeEjecutivo.tsx`

Props: `{ report: BalanceReport | null; history: HistoryEntry[] }` (igual patrón que
`AnalyticsPanel`). Si `!report`, muestra el mismo empty-state que las otras vistas.

Layout, con tokens del design system existente (`card-premium`, `glass`, `text-gradient`,
colores `--conaf`, etc.):
- Encabezado del informe: logo/título CONAF, período, fecha, veredicto con medidor de
  salud (score 0-100) y titular.
- Secciones de narrativa, cada una con color según severidad.
- Dos o tres gráficos clave reusando recharts (ejecución por programa, proyección).
- Tabla resumen de programas con semáforo (verde/ámbar/rojo por nivel de riesgo).
- Botón "Exportar PDF" (clase `no-print`) que llama `window.print()`.

### 3. Export PDF (print stylesheet en `src/index.css`)

Bloque `@media print`:
- `body * { visibility: hidden }` y `.informe-print-area, .informe-print-area * { visibility: visible }`.
- `.informe-print-area` posicionado a página completa.
- `.no-print { display: none }` para botones, sidebar, header de app.
- Colores forzados con `-webkit-print-color-adjust: exact`.

### 4. Wiring

- `Sidebar.tsx`: nuevo item nav `informe` ("Informe", "Reporte ejecutivo").
- `views/Index.tsx`: entrada en `viewMeta` + render condicional `activeView === 'informe'`.
- `CommandPalette.tsx`: comando `nav-informe`.

## Verificación (criterios de éxito)

1. `narrative.ts` tiene tests unitarios (vitest) con un `BalanceReport` de ejemplo →
   verifica que genera veredicto y las 4 secciones con severidad coherente.
2. `next build` (export) y `vitest` verdes.
3. La vista renderiza en el navegador con datos reales (abril 2026) sin errores de consola.
4. "Exportar PDF" abre el diálogo de impresión con solo el informe visible.
5. Cero regresiones en las vistas existentes.
