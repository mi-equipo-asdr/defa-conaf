"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { parseSigfeFile, generateBalance } from "@/lib/parser";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

type Status = "idle" | "reading" | "parsing" | "generating" | "done" | "error";

export default function SubirPage() {
  const { setReport, addHistory } = useAppState();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState({ rows: 0, programas: 0, items: 0 });
  const [error, setError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setError("");

      try {
        setStatus("reading");
        const buffer = await file.arrayBuffer();

        setStatus("parsing");
        await new Promise((r) => setTimeout(r, 500)); // visual feedback
        const rows = parseSigfeFile(buffer);

        if (rows.length === 0) {
          throw new Error("No se encontraron datos válidos en el archivo");
        }

        setStatus("generating");
        await new Promise((r) => setTimeout(r, 400));
        const report = generateBalance(rows);

        setStats({
          rows: report.totalRows,
          programas: report.programas.length,
          items: report.totalItems,
        });

        setReport(report);
        addHistory({
          mes: report.periodo,
          presupuesto: report.totalPresupuesto,
          compromiso: report.totalCompromiso,
          pctAvance: report.pctAvanceGlobal,
        });

        setStatus("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar archivo");
        setStatus("error");
      }
    },
    [setReport, addHistory]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const steps = [
    { key: "reading", label: "Leyendo archivo" },
    { key: "parsing", label: "Extrayendo datos SIGFE" },
    { key: "generating", label: "Generando balance" },
  ];

  const statusOrder = ["reading", "parsing", "generating", "done"];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subir Archivo SIGFE</h1>
        <p className="text-gray-500 mt-1">
          Sube el .xls de Disponibilidad de Requerimientos descargado de SIGFE
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
          dragOver
            ? "border-emerald-500 bg-emerald-50"
            : status === "idle"
              ? "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50"
              : "border-gray-200 bg-gray-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
        {status === "idle" ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Arrastra el archivo .xls aquí
            </p>
            <p className="text-gray-400 text-sm mt-1">o haz clic para seleccionar</p>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">{fileName}</p>
          </>
        )}
      </div>

      {/* Processing steps */}
      {status !== "idle" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          {steps.map((step, i) => {
            const stepIdx = statusOrder.indexOf(step.key);
            const isDone = currentIdx > stepIdx || status === "done";
            const isActive = currentIdx === stepIdx && status !== "done" && status !== "error";

            return (
              <div key={step.key} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isDone ? "text-emerald-700 font-medium" : isActive ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}

          {status === "error" && (
            <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {status === "done" && (
            <div className="pt-4 border-t space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.rows}</p>
                  <p className="text-xs text-gray-500">Líneas procesadas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.programas}</p>
                  <p className="text-xs text-gray-500">Programas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.items}</p>
                  <p className="text-xs text-gray-500">Ítems agrupados</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/balance")}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Ver Balance Generado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
