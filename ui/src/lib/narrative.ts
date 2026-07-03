import type { BalanceReport, HistoryEntry } from './types';
import { calcHealthScore, calcBurnForecast, calcVariance, rankPrograms } from './analytics';

export type Severidad = 'positivo' | 'neutral' | 'atencion' | 'critico';

export interface InformeSeccion {
  id: string;
  titulo: string;
  severidad: Severidad;
  parrafo: string;
  bullets?: string[];
}

export interface Informe {
  periodo: string;
  oficina: string;
  fechaGeneracion: string;
  veredicto: { label: string; color: string; score: number; titular: string };
  secciones: InformeSeccion[];
}

const MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fmtCLP(v: number): string {
  const abs = Math.abs(v);
  const signo = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${signo}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${signo}$${(abs / 1e6).toFixed(0)}M`;
  return `${signo}$${abs.toLocaleString('es-CL')}`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

export function generateInforme(report: BalanceReport, history: HistoryEntry[]): Informe {
  const health = calcHealthScore(report);
  const forecast = calcBurnForecast(report, history);
  const variance = calcVariance(report);
  const ranking = rankPrograms(report);

  const mesNum = new Date().getMonth() + 1;
  const mesNombre = MESES[mesNum];
  const esperadoPct = (mesNum / 12) * 100;
  const brecha = report.pctAvanceGlobal - esperadoPct;

  const secciones: InformeSeccion[] = [];

  // ── 1. Ejecución global ─────────────────────────────────────
  const sevGlobal: Severidad = Math.abs(brecha) <= 8 ? 'positivo' : brecha < -20 ? 'critico' : 'atencion';
  const brechaTxt = Math.abs(brecha) <= 8
    ? 'en línea con el ritmo esperado'
    : brecha < 0
      ? `${Math.abs(brecha).toFixed(0)}pp bajo lo esperado`
      : `${brecha.toFixed(0)}pp sobre lo esperado`;
  secciones.push({
    id: 'global',
    titulo: 'Ejecución global',
    severidad: sevGlobal,
    parrafo: `Al mes de ${mesNombre}, la ejecución presupuestaria regional alcanza ${fmtPct(report.pctAvanceGlobal)} ` +
      `(${fmtCLP(report.totalCompromiso)} comprometidos de ${fmtCLP(report.totalPresupuesto)}), ${brechaTxt} para esta altura del año. ` +
      `El saldo disponible es de ${fmtCLP(report.totalSaldo)} distribuido en ${report.programas.length} programas.`,
  });

  // ── 2. Programas destacados ─────────────────────────────────
  const adelantados = variance.filter((v) => v.status === 'adelantado' || v.status === 'sobregirado')
    .sort((a, b) => b.varianzaPct - a.varianzaPct);
  const retrasados = variance.filter((v) => v.status === 'retrasado')
    .sort((a, b) => a.varianzaPct - b.varianzaPct);
  const lider = ranking[0];
  const rezagado = ranking[ranking.length - 1];

  const bulletsProg: string[] = [];
  if (lider) bulletsProg.push(`Mayor ejecución: ${lider.nombre} con ${fmtPct(lider.pctAvance)}.`);
  if (rezagado && rezagado.codigo !== lider?.codigo) bulletsProg.push(`Menor ejecución: ${rezagado.nombre} con ${fmtPct(rezagado.pctAvance)}.`);
  if (adelantados.length) bulletsProg.push(`Adelantados respecto al calendario: ${adelantados.slice(0, 3).map((v) => v.programa).join(', ')}.`);
  if (retrasados.length) bulletsProg.push(`En riesgo de subejecución: ${retrasados.slice(0, 3).map((v) => v.programa).join(', ')}.`);

  const sevProg: Severidad = retrasados.length >= 3 ? 'atencion' : retrasados.length ? 'neutral' : 'positivo';
  secciones.push({
    id: 'programas',
    titulo: 'Programas destacados',
    severidad: sevProg,
    parrafo: retrasados.length
      ? `Hay ${retrasados.length} programa(s) con ejecución bajo lo esperado que requieren seguimiento para evitar subejecución al cierre, ` +
        `frente a ${adelantados.length} que avanzan según o por sobre el calendario.`
      : `Todos los programas avanzan dentro del rango esperado para esta altura del año. No se observan rezagos relevantes.`,
    bullets: bulletsProg,
  });

  // ── 3. Proyección de cierre ─────────────────────────────────
  const sevForecast: Severidad = forecast.riesgoSobregiro
    ? 'critico'
    : forecast.mesAgotamiento
      ? 'atencion'
      : forecast.proyeccionCierre >= 90
        ? 'positivo'
        : 'neutral';
  let parrafoForecast = `Proyectando el ritmo de gasto actual (~${fmtCLP(forecast.burnMensual)} mensuales) sobre los ${forecast.mesesRestantes} meses restantes, ` +
    `la ejecución cerraría el año en torno a ${fmtPct(forecast.proyeccionCierre)}.`;
  if (forecast.riesgoSobregiro) {
    parrafoForecast += ` A este ritmo el presupuesto se sobregira: el saldo proyectado es ${fmtCLP(forecast.saldoProyectado)}.`;
  } else if (forecast.mesAgotamiento) {
    parrafoForecast += ` De mantenerse, el saldo se agotaría hacia ${forecast.mesAgotamiento}, antes del cierre del ejercicio.`;
  } else {
    parrafoForecast += ` El saldo proyectado al cierre es ${fmtCLP(forecast.saldoProyectado)}, dentro de lo esperable.`;
  }
  secciones.push({
    id: 'forecast',
    titulo: 'Proyección de cierre',
    severidad: sevForecast,
    parrafo: parrafoForecast,
  });

  // ── 4. Recomendaciones ──────────────────────────────────────
  const recs: string[] = [];
  if (retrasados.length) recs.push(`Acelerar la ejecución de ${retrasados.slice(0, 2).map((v) => v.programa).join(' y ')} o reasignar saldo antes del cierre.`);
  if (forecast.riesgoSobregiro) recs.push('Revisar compromisos: la proyección indica sobregiro presupuestario.');
  if (forecast.mesAgotamiento && !forecast.riesgoSobregiro) recs.push(`Planificar el gasto del segundo semestre: el saldo se agotaría hacia ${forecast.mesAgotamiento}.`);
  const sobregirados = report.alertas.filter((a) => a.tipo === 'sobregirado');
  if (sobregirados.length) recs.push(`Regularizar ${sobregirados.length} ítem(es) sobregirado(s) detectado(s) en el balance.`);
  if (!recs.length) recs.push('Mantener el ritmo actual de ejecución y continuar el monitoreo mensual.');

  secciones.push({
    id: 'recomendaciones',
    titulo: 'Recomendaciones',
    severidad: recs.length > 1 ? 'atencion' : 'neutral',
    parrafo: 'Acciones sugeridas para la gestión del período:',
    bullets: recs,
  });

  // ── Veredicto ───────────────────────────────────────────────
  const titular = health.total >= 80
    ? 'La gestión presupuestaria regional se encuentra en buen estado.'
    : health.total >= 60
      ? 'La gestión presupuestaria avanza de forma razonable, con puntos a vigilar.'
      : health.total >= 40
        ? 'La gestión presupuestaria requiere atención en varios frentes.'
        : 'La gestión presupuestaria presenta señales críticas que exigen acción inmediata.';

  return {
    periodo: report.periodo,
    oficina: report.oficina,
    fechaGeneracion: report.fechaGeneracion,
    veredicto: { label: health.label, color: health.color, score: health.total, titular },
    secciones,
  };
}
