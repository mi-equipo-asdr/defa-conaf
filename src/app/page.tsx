"use client";

import { useAppState } from "@/lib/store";
import { formatMillions, pctColor, cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#059669", "#0891b2", "#7c3aed", "#d97706", "#dc2626", "#2563eb"];

export default function Dashboard() {
  const { report } = useAppState();

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Sube un archivo SIGFE para ver el dashboard</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Presupuesto Total",
      value: formatMillions(report.totalPresupuesto),
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-700",
      iconColor: "bg-emerald-100",
    },
    {
      label: "Ejecutado",
      value: `${report.pctAvanceGlobal.toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-700",
      iconColor: "bg-blue-100",
    },
    {
      label: "Saldo Disponible",
      value: formatMillions(report.totalSaldo),
      icon: Wallet,
      color: "bg-amber-50 text-amber-700",
      iconColor: "bg-amber-100",
    },
    {
      label: "Alertas",
      value: String(report.alertas.length),
      icon: AlertTriangle,
      color: "bg-red-50 text-red-700",
      iconColor: "bg-red-100",
    },
  ];

  const chartData = report.programas.map((p) => ({
    name: p.codigo === "07" ? "PEE" : `P${p.codigo}`,
    fullName: p.nombre,
    presupuesto: p.presupuesto / 1_000_000,
    compromiso: p.compromiso / 1_000_000,
    pct: p.pctAvance,
  }));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {report.oficina} — {report.periodo}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
              <div className={cn("p-3 rounded-lg", kpi.iconColor)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color.split(" ")[1])} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Ejecución por Programa (M$)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(0)}M`, ""]}
                labelFormatter={(l, payload) =>
                  payload?.[0]?.payload?.fullName || l
                }
              />
              <Bar dataKey="presupuesto" name="Presupuesto" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compromiso" name="Ejecutado" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Avance por Programa</h2>
          <div className="space-y-4">
            {report.programas.map((p) => (
              <div key={p.codigo}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {p.codigo === "07" ? "PEE" : `CONAF ${p.codigo}`}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      pctColor(p.pctAvance)
                    )}
                  >
                    {p.pctAvance.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      p.pctAvance > 100
                        ? "bg-red-500"
                        : p.pctAvance > 90
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(p.pctAvance, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {report.alertas.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Alertas</h2>
          <div className="space-y-3">
            {report.alertas.map((a, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm",
                  a.tipo === "sobregirado"
                    ? "bg-red-50 text-red-800"
                    : a.tipo === "alto"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-blue-50 text-blue-800"
                )}
              >
                {a.tipo === "sobregirado" || a.tipo === "alto" ? (
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 shrink-0" />
                )}
                <span>{a.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
