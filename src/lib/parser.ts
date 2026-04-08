import * as XLSX from "xlsx";
import type { SigfeRow, BalanceItem, ProgramaSummary, BalanceReport, Alerta } from "./types";

const PROGRAMA_NAMES: Record<string, string> = {
  "01": "CONAF 01 - Corporación Nacional",
  "03": "CONAF 03 - Manejo del Fuego",
  "04": "CONAF 04 - Áreas Silvestres",
  "05": "CONAF 05 - Gestión Forestal",
  "06": "CONAF 06 - Programa de Arborización",
  "07": "PEE - Programas de Empleos",
};

const VIATICO_CODES = ["2101004006", "2101004007", "2101004"];

function isViatico(conceptoCodigo: string): boolean {
  return VIATICO_CODES.some((v) => conceptoCodigo.startsWith(v));
}

function extractProgramaCodigo(raw: string): string {
  const match = raw.match(/- (\d{2})/);
  return match ? match[1] : "00";
}

function extractConceptoCodigo(concepto: string): string {
  const match = concepto.match(/^(\d+)/);
  return match ? match[1] : "";
}

export function parseSigfeFile(buffer: ArrayBuffer): SigfeRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, { header: 1 });

  // Find header row (contains "Folio")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const row = raw[i];
    if (row && row.some((c) => String(c).includes("Folio"))) {
      headerIdx = i;
      break;
    }
  }

  const rows: SigfeRow[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || !r[1] || typeof r[1] !== "number") continue;

    const programaRaw = String(r[5] || "");
    const conceptoFull = String(r[11] || "");

    rows.push({
      unidadEjecutora: String(r[0] || ""),
      folio: r[1] as number,
      titulo: String(r[2] || "").trim(),
      tipoPresupuesto: String(r[3] || ""),
      moneda: String(r[4] || ""),
      programaRaw,
      programaCodigo: extractProgramaCodigo(programaRaw),
      programaNombre: "",
      programaPublico: String(r[7] || ""),
      unidadDemandante: String(r[8] || ""),
      productoEstrategico: String(r[9] || ""),
      centroCosto: String(r[10] || ""),
      conceptoPresupuesto: conceptoFull,
      conceptoCodigo: extractConceptoCodigo(conceptoFull),
      montoVigente: (r[12] as number) || 0,
      montoDisponible: (r[13] as number) || 0,
      montoConsumido: (r[14] as number) || 0,
    });
  }

  return rows;
}

export function generateBalance(rows: SigfeRow[]): BalanceReport {
  // Extract office name from first row
  const oficina = rows[0]?.unidadEjecutora.replace(/^\d+\s*/, "").trim() || "Oficina";

  // Group by folio
  const folioMap = new Map<number, { titulo: string; programa: string; programaCodigo: string; items: SigfeRow[] }>();

  for (const row of rows) {
    if (!folioMap.has(row.folio)) {
      folioMap.set(row.folio, {
        titulo: row.titulo,
        programa: row.programaCodigo,
        programaCodigo: row.programaCodigo,
        items: [],
      });
    }
    folioMap.get(row.folio)!.items.push(row);
  }

  // Build balance items (one per folio, split ByS vs Viático)
  const balanceItems: BalanceItem[] = [];

  for (const [folio, data] of folioMap) {
    const bysRows = data.items.filter((r) => !isViatico(r.conceptoCodigo));
    const viatRows = data.items.filter((r) => isViatico(r.conceptoCodigo));

    if (bysRows.length > 0) {
      const ppto = bysRows.reduce((s, r) => s + r.montoVigente, 0);
      const comp = bysRows.reduce((s, r) => s + r.montoConsumido, 0);
      balanceItems.push({
        folio,
        titulo: data.titulo + " (ByS)",
        programa: data.programaCodigo,
        programaCodigo: data.programaCodigo,
        tipo: "bys",
        presupuesto: ppto,
        compromiso: comp,
        saldo: ppto - comp,
        pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0,
      });
    }

    if (viatRows.length > 0) {
      const ppto = viatRows.reduce((s, r) => s + r.montoVigente, 0);
      const comp = viatRows.reduce((s, r) => s + r.montoConsumido, 0);
      balanceItems.push({
        folio,
        titulo: data.titulo + " (Viático)",
        programa: data.programaCodigo,
        programaCodigo: data.programaCodigo,
        tipo: "viatico",
        presupuesto: ppto,
        compromiso: comp,
        saldo: ppto - comp,
        pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0,
      });
    }
  }

  // Group by programa
  const progMap = new Map<string, BalanceItem[]>();
  for (const item of balanceItems) {
    const key = item.programaCodigo;
    if (!progMap.has(key)) progMap.set(key, []);
    progMap.get(key)!.push(item);
  }

  const programas: ProgramaSummary[] = [...progMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([codigo, items]) => {
      const presupuesto = items.reduce((s, i) => s + i.presupuesto, 0);
      const compromiso = items.reduce((s, i) => s + i.compromiso, 0);
      return {
        codigo,
        nombre: PROGRAMA_NAMES[codigo] || `Programa ${codigo}`,
        presupuesto,
        compromiso,
        saldo: presupuesto - compromiso,
        pctAvance: presupuesto > 0 ? (compromiso / presupuesto) * 100 : 0,
        items,
      };
    });

  // Totals
  const totalPresupuesto = programas.reduce((s, p) => s + p.presupuesto, 0);
  const totalCompromiso = programas.reduce((s, p) => s + p.compromiso, 0);

  // Alerts
  const alertas: Alerta[] = [];
  for (const item of balanceItems) {
    if (item.pctAvance > 100) {
      alertas.push({
        tipo: "sobregirado",
        programa: item.programaCodigo,
        folio: item.folio,
        titulo: item.titulo,
        pct: item.pctAvance,
        mensaje: `Folio ${item.folio} sobregirado: ${item.pctAvance.toFixed(1)}%`,
      });
    } else if (item.pctAvance > 90) {
      alertas.push({
        tipo: "alto",
        programa: item.programaCodigo,
        folio: item.folio,
        titulo: item.titulo,
        pct: item.pctAvance,
        mensaje: `Folio ${item.folio} al ${item.pctAvance.toFixed(1)}%`,
      });
    }
  }

  for (const prog of programas) {
    if (prog.pctAvance < 30) {
      alertas.push({
        tipo: "bajo",
        programa: prog.codigo,
        titulo: prog.nombre,
        pct: prog.pctAvance,
        mensaje: `${prog.nombre} sub-ejecutado: ${prog.pctAvance.toFixed(1)}%`,
      });
    }
  }

  return {
    oficina,
    periodo: new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" }),
    fechaGeneracion: new Date().toISOString(),
    totalPresupuesto,
    totalCompromiso,
    totalSaldo: totalPresupuesto - totalCompromiso,
    pctAvanceGlobal: totalPresupuesto > 0 ? (totalCompromiso / totalPresupuesto) * 100 : 0,
    programas,
    alertas,
    totalRows: rows.length,
    totalItems: balanceItems.length,
  };
}
