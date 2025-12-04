import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Login Portal",
  description: "Login and registration portal for Admin & Users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
