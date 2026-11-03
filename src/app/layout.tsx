import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Tree — Kutumb",
  description: "Build, visualize, and share your family heritage across generations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
