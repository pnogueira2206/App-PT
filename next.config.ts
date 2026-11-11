import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O mesmo domínio com o ponto final de DNS ("...netlify.app."): alguns browsers
      // ou atalhos guardados abrem a app assim, e a Next rejeitava o login e as outras
      // ações por o "origin" não coincidir com o host.
      allowedOrigins: ["cfaavaliacaotreinador.netlify.app."],
    },
  },
};

export default nextConfig;
