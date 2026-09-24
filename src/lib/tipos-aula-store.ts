import { tiposDeAula as tiposDeAulaSeed } from "@/data/mock";
import { criarListaGerivel } from "@/lib/lista-gerivel-store";

export const tiposAulaStore = criarListaGerivel("cfa-tipos-aula-v1", tiposDeAulaSeed);
