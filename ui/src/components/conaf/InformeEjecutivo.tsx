import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Printer, TrendingUp, AlertTriangle, CheckCircle2, Info, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend,
} from 'recharts';
import type { BalanceReport, HistoryEntry } from '@/lib/types';
import { generateInforme, type Severidad } from '@/lib/narrative';
import { rankPrograms } from '@/lib/analytics';
import logo3dAsset from '@/assets/conaf-logo-3d.png';
import emptyStateAsset from '@/assets/empty-state.png';

const logo3d = logo3dAsset.src;
const emptyState = emptyStateAsset.src;

interface Props {
  report: BalanceReport | null;
  history: HistoryEntry[];
}

const sevStyle: Record<Severidad, { bar: string; bg: string; text: string; icon: typeof Info }> = {
  positivo: { bar: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  neutral: { bar: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700', icon: Info },
  atencion: { bar: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle },
  critico: { bar: '#dc2626', bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle },
};

const riskColor: Record<string, string> = {
  low: '#059669',
  medium: '#2563eb',
  high: '#d97706',
  critical: '#dc2626',
};
const riskLabel: Record<string, string> = {
  low: 'En rango',
  medium: 'Subejecución',
  high: 'Alto',
  critical: 'Sobregiro',
};

function fmtCLP(v: number): string {
  const abs = Math.abs(v);
  const signo = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${signo}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${signo}$${(abs / 1e6).toFixed(0)}M`;
  return `${signo}$${abs.toLocaleString('es-CL')}`;
}

export function InformeEjecutivo({ report, history }: Props) {
  const informe = useMemo(() => (report ? generateInforme(report, history) : null), [report, history]);
  const ranking = useMemo(() => (report ? rankPrograms(report) : []), [report]);

  const chartData = useMemo(() => {
    if (!report) return [];
    return report.programas.map((p) => ({
      nombre: p.nombre.length > 16 ? p.nombre.slice(0, 15) + '…' : p.nombre,
      presupuesto: Math.round(p.presupuesto / 1e6),
      ejecutado: Math.round(p.compromiso / 1e6),
    }));
  }, [report]);

  if (!report || !informe) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <img src={emptyState} alt="" className="w-36 h-36 mb-8 drop-shadow-[0_0_30px_rgba(52,211,153,0.15)]" width={512} height={512} />
        <p className="text-xl font-bold text-foreground">Sin datos para el informe</p>
        <p className="text-sm text-muted-foreground mt-1">Sube un balance SIGFE para generar el informe ejecutivo.</p>
      </div>
    );
  }

  const gaugePct = informe.veredicto.score;

  return (
    <div className="space-y-5">
      {/* Barra de acciones (no se imprime) */}
      <div className="no-print flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Informe Ejecutivo</h2>
          <p className="text-sm text-muted-foreground">Reporte narrado del período, listo para presentar o exportar.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:brightness-105 transition-all"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Área imprimible */}
      <div className="informe-print-area bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {/* Encabezado institucional */}
        <div className="relative bg-[#0a0f1e] text-white px-8 py-7 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={logo3d} alt="" className="w-14 h-14 drop-shadow-[0_0_16px_rgba(52,211,153,0.35)]" width={56} height={56} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">DEFA CONAF · Los Ríos</p>
                <h1 className="text-2xl font-extrabold tracking-tight leading-tight">Informe Ejecutivo Presupuestario</h1>
                <div className="flex items-center gap-2 mt-1 text-slate-400 text-[12px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{report.periodo}</span>
                  <span className="text-slate-600">·</span>
                  <span>{report.oficina}</span>
                </div>
              </div>
            </div>
            {/* Medidor de salud */}
            <div className="text-right shrink-0">
              <div className="inline-flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center relative"
                  style={{ background: `conic-gradient(${informe.veredicto.color} ${gaugePct * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
                >
                  <div className="w-15 h-15 rounded-full bg-[#0a0f1e] flex flex-col items-center justify-center" style={{ width: '60px', height: '60px' }}>
                    <span className="text-2xl font-extrabold font-mono-num" style={{ color: informe.veredicto.color }}>{gaugePct}</span>
                  </div>
                </div>
                <span className="mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${informe.veredicto.color}22`, color: informe.veredicto.color }}>
                  {informe.veredicto.label}
                </span>
              </div>
            </div>
          </div>
          <p className="relative mt-4 text-[13px] text-slate-300 leading-relaxed max-w-3xl">{informe.veredicto.titular}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { label: 'Presupuesto', value: fmtCLP(report.totalPresupuesto) },
            { label: 'Ejecutado', value: fmtCLP(report.totalCompromiso) },
            { label: 'Saldo', value: fmtCLP(report.totalSaldo) },
            { label: 'Avance', value: `${report.pctAvanceGlobal.toFixed(1)}%` },
          ].map((k) => (
            <div key={k.label} className="px-6 py-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{k.label}</p>
              <p className="text-xl font-extrabold text-slate-900 font-mono-num mt-0.5">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Narrativa */}
        <div className="px-8 py-6 space-y-4">
          {informe.secciones.map((s, i) => {
            const st = sevStyle[s.severidad];
            const Icon = st.icon;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-4"
              >
                <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full" style={{ backgroundColor: st.bar }} />
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: st.bar }} />
                  <h3 className="text-[15px] font-bold text-slate-900">{s.titulo}</h3>
                </div>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">{s.parrafo}</p>
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13px] text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.bar }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Gráfico */}
        <div className="px-8 pb-6">
          <h3 className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" /> Presupuesto vs ejecución por programa (M$)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" height={56} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('es-CL')} M$`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="presupuesto" name="Presupuesto" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ejecutado" name="Ejecutado" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla resumen con semáforo */}
        <div className="px-8 pb-8">
          <h3 className="text-[13px] font-bold text-slate-700 mb-3">Detalle por programa</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-2.5">Programa</th>
                  <th className="text-right font-semibold px-4 py-2.5">Presupuesto</th>
                  <th className="text-right font-semibold px-4 py-2.5">Ejecutado</th>
                  <th className="text-right font-semibold px-4 py-2.5">Avance</th>
                  <th className="text-left font-semibold px-4 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranking.map((r) => {
                  const p = report.programas.find((x) => x.codigo === r.codigo)!;
                  return (
                    <tr key={r.codigo} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{p.nombre}</td>
                      <td className="px-4 py-2.5 text-right font-mono-num text-slate-600">{fmtCLP(p.presupuesto)}</td>
                      <td className="px-4 py-2.5 text-right font-mono-num text-slate-600">{fmtCLP(p.compromiso)}</td>
                      <td className="px-4 py-2.5 text-right font-mono-num font-semibold text-slate-800">{p.pctAvance.toFixed(1)}%</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor[r.riskLevel] }} />
                          <span style={{ color: riskColor[r.riskLevel] }}>{riskLabel[r.riskLevel]}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10.5px] text-slate-400 flex items-center gap-1.5">
            <Printer className="w-3 h-3" />
            Generado por CONAFSync · {report.periodo} · Fecha de generación del balance: {report.fechaGeneracion}
          </p>
        </div>
      </div>
    </div>
  );
}
