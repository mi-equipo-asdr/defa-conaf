import type { NextConfig } from "next";

// output: "export" solo en build — en dev rompe la carga directa de rutas
// fuera de generateStaticParams (mismo criterio que comunidad-vdrc).
const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "production" ? { output: "export" as const } : {}),
  typescript: {
    // Paridad con Vite (nunca corrió tsc en build); la deuda de tipos es tarea aparte.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
