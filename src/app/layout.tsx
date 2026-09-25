import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NavTabs } from "@/components/nav-tabs";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CFA Avaliações",
  description: "Avaliação de desempenho do staff da CrossFit Alvalade",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CFA Avaliações",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-dim">
        <SessionProvider session={session}>
          <header className="bg-panel border-b border-line px-4 py-3 md:px-6">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <Image
                src="/logo-cfa.jpg"
                alt="CrossFit Alvalade"
                width={32}
                height={32}
                className="grayscale contrast-125"
              />
              <div className="flex-1">
                <p className="font-mono text-sm font-bold tracking-wide text-black">CFA AVALIAÇÕES</p>
                <p className="font-mono text-[10px] tracking-wide text-dim">AVALIAÇÃO DE DESEMPENHO DO STAFF</p>
              </div>
              {session && (
                <div className="text-right">
                  <Link href="/perfil" className="font-mono block text-xs text-muted underline">
                    {session.user.name}
                  </Link>
                  <SignOutButton />
                </div>
              )}
            </div>
          </header>
          {session && <NavTabs papel={session.user.papel} />}
          <main className="flex-1">{children}</main>
          <ServiceWorkerRegister />
        </SessionProvider>
      </body>
    </html>
  );
}
