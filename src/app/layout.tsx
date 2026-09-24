import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  maximumScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <SessionProvider session={session}>
          <header className="flex items-center gap-3 bg-black px-4 py-3 text-white">
            <Image src="/logo-cfa.jpg" alt="CrossFit Alvalade" width={32} height={32} className="rounded" />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">CFA Avaliações</p>
              <p className="text-xs leading-tight text-neutral-400">Avaliação de desempenho do staff</p>
            </div>
            {session && (
              <div className="text-right">
                <Link href="/perfil" className="block text-xs text-neutral-300 underline">
                  {session.user.name}
                </Link>
                <SignOutButton />
              </div>
            )}
          </header>
          {session && <NavTabs papel={session.user.papel} />}
          <main className="flex-1">{children}</main>
          <ServiceWorkerRegister />
        </SessionProvider>
      </body>
    </html>
  );
}
