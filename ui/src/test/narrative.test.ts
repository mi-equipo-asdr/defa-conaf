import { describe, it, expect } from "vitest";
import { generateInforme } from "@/lib/narrative";
import type { BalanceReport, ProgramaSummary } from "@/lib/types";

function prog(codigo: string, nombre: string, ppto: number, comp: number): ProgramaSummary {
  const saldo = ppto - comp;
  return { codigo, nombre, presupuesto: ppto, compromiso: comp, saldo, pctAvance: ppto > 0 ? (comp / ppto) * 100 : 0, items: [] };
}

function makeReport(programas: ProgramaSummary[]): BalanceReport {
  const totalPresupuesto = programas.reduce((s, p) => s + p.presupuesto, 0);
  const totalCompromiso = programas.reduce((s, p) => s + p.compromiso, 0);
  return {
    oficina: "Regional Los Ríos",
    periodo: "Abril 2026",
    fechaGeneracion: "2026-04-30",
    totalPresupuesto,
    totalCompromiso,
    totalSaldo: totalPresupuesto - totalCompromiso,
    pctAvanceGlobal: totalPresupuesto > 0 ? (totalCompromiso / totalPresupuesto) * 100 : 0,
    programas,
    alertas: [],
    totalRows: 0,
    totalItems: 0,
  };
}

describe("generateInforme", () => {
  const report = makeReport([
    prog("01", "Dirección-DEFA", 2_000_000_000, 700_000_000),
    prog("03", "DEPRIF", 3_000_000_000, 2_600_000_000),
    prog("06", "Arborización", 2_000_000_000, 400_000_000),
  ]);

  it("genera veredicto con score y titular", () => {
    const informe = generateInforme(report, []);
    expect(informe.veredicto.score).toBeGreaterThanOrEqual(0);
    expect(informe.veredicto.score).toBeLessThanOrEqual(100);
    expect(informe.veredicto.titular.length).toBeGreaterThan(10);
    expect(informe.veredicto.label).toBeTruthy();
  });

  it("genera las cuatro secciones esperadas", () => {
    const informe = generateInforme(report, []);
    const ids = informe.secciones.map((s) => s.id);
    expect(ids).toEqual(["global", "programas", "forecast", "recomendaciones"]);
    informe.secciones.forEach((s) => {
      expect(s.parrafo.length).toBeGreaterThan(10);
      expect(["positivo", "neutral", "atencion", "critico"]).toContain(s.severidad);
    });
  });

  it("propaga período y oficina del reporte", () => {
    const informe = generateInforme(report, []);
    expect(informe.periodo).toBe("Abril 2026");
    expect(informe.oficina).toBe("Regional Los Ríos");
  });

  it("marca sobregiro como crítico en la proyección", () => {
    // Programa que ya gastó casi todo temprano en el año → proyección de sobregiro.
    const sobregiro = makeReport([prog("01", "Test", 1_000_000_000, 950_000_000)]);
    const informe = generateInforme(sobregiro, []);
    const forecast = informe.secciones.find((s) => s.id === "forecast")!;
    expect(forecast.severidad).toBe("critico");
  });

  it("incluye recomendaciones accionables", () => {
    const informe = generateInforme(report, []);
    const recs = informe.secciones.find((s) => s.id === "recomendaciones")!;
    expect(recs.bullets && recs.bullets.length).toBeGreaterThan(0);
  });
});
