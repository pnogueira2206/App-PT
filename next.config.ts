import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O relatório em PDF (src/lib/pdf/relatorio-avaliacao.tsx) lê estes ficheiros do
  // disco em runtime via process.cwd() (fontes + logo), não via import — o Next não
  // os deteta sozinho ao analisar dependências, por isso ficam de fora do bundle da
  // função serverless e a geração do PDF falha em produção (OK em dev, onde
  // process.cwd() aponta para o projeto completo).
  outputFileTracingIncludes: {
    "/*": ["src/lib/pdf/fonts/**/*", "public/logo-cfa.jpg"],
  },
};

export default nextConfig;
