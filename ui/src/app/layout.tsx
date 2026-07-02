import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DEFA CONAF Los Ríos",
  description: "Sistema de gestión presupuestaria DEFA CONAF Los Ríos",
  authors: [{ name: "DEFA CONAF" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
