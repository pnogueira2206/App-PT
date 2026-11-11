import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Image from "next/image";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NavTabs } from "@/components/nav-tabs";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";

const TEMA_INIT_SCRIPT = `
(function () {
  try {
    var tema = localStorage.getItem("cfa-theme");
    var escuro = tema ? tema === "dark" : true;
    if (escuro) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Títulos, menu e números: a mesma letra do relatório em PDF.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-neutral-800 dark:text-neutral-200">
        <Script id="cfa-theme-init" strategy="beforeInteractive">
          {TEMA_INIT_SCRIPT}
        </Script>
        <SessionProvider session={session}>
          <header className="border-b-[3px] border-accent bg-neutral-950 px-4 py-3 md:px-6">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <Image
                src="/logo-cfa.jpg"
                alt="CrossFit Alvalade"
                width={32}
                height={32}
                className="rounded-sm"
              />
              <div className="flex-1">
                <p className="font-mono text-lg font-bold leading-tight tracking-wider text-white">CFA AVALIAÇÕES</p>
                <p className="font-mono text-xs tracking-wider text-neutral-400">AVALIAÇÃO DE DESEMPENHO DO STAFF</p>
              </div>
              <ThemeToggle />
              {session && (
                <div className="text-right">
                  <Link href="/perfil" className="block text-xs text-white underline">
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
