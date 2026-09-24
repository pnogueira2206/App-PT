import { treinadores as treinadoresSeed } from "@/data/mock";
import { criarListaGerivel } from "@/lib/lista-gerivel-store";

export const treinadoresStore = criarListaGerivel("cfa-treinadores-v1", treinadoresSeed);
