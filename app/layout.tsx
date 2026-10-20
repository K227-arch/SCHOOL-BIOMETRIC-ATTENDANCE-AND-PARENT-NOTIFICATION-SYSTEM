import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Kathay | School Biometric Attendance & Parent Notification",
  description:
    "Reliable entry and exit recording, parent SMS notifications, exception management and school reports. A multi-school attendance platform by Kathay Technologies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <AuthGate>
            {children}
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
