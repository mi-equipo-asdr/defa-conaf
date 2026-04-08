"use client";

import { useAppState } from "@/lib/store";
import { formatCLP, pctColor, cn } from "@/lib/utils";
import { Download, Table } from "lucide-react";

export default function BalancePage() {
  const { report } = useAppState();

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Sube un archivo SIGFE para ver el balance</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Presupuestario Mensual</h1>
          <p className="text-gray-500 mt-1">
            {report.oficina} — {report.periodo}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Download className="w-4 h-4" />
          Exportar .xlsx
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Presupuesto", value: formatCLP(report.totalPresupuesto) },
          { label: "Compromiso", value: formatCLP(report.totalCompromiso) },
          { label: "Saldo", value: formatCLP(report.totalSaldo) },
          { label: "Avance", value: `${report.pctAvanceGlobal.toFixed(1)}%` },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border rounded-lg px-4 py-3 text-center"
          >
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-lg font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Table by program */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Folio</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Título</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Presupuesto</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Compromiso</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Saldo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {report.programas.map((prog) => (
                <>
                  {/* Program header */}
                  <tr key={`h-${prog.codigo}`} className="bg-emerald-50 border-t-2 border-emerald-200">
                    <td colSpan={4} className="px-4 py-2 font-bold text-emerald-900">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        {prog.nombre}
                      </div>
                    </td>
                    <td className="text-right px-4 py-2 font-bold text-emerald-900">
                      {formatCLP(prog.compromiso)}
                    </td>
                    <td className="text-right px-4 py-2 font-bold text-emerald-900">
                      {formatCLP(prog.saldo)}
                    </td>
                    <td className="text-right px-4 py-2">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold",
                          pctColor(prog.pctAvance)
                        )}
                      >
                        {prog.pctAvance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  {/* Items */}
                  {prog.items.map((item, idx) => (
                    <tr
                      key={`${prog.codigo}-${item.folio}-${item.tipo}-${idx}`}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-600">{item.folio}</td>
                      <td className="px-4 py-2 text-gray-900 max-w-xs truncate">{item.titulo}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            item.tipo === "viatico"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {item.tipo === "viatico" ? "Viático" : "ByS"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">
                        {formatCLP(item.presupuesto)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">
                        {formatCLP(item.compromiso)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">
                        {formatCLP(item.saldo)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                            pctColor(item.pctAvance)
                          )}
                        >
                          {item.pctAvance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
