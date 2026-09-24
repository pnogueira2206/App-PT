import { AvaliacaoGuardada, subtotalSeccao, totalGeralObtido } from "@/types/avaliacao";

function escaparCsv(valor: string): string {
  if (/[",\n;]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function gerarCsvAvaliacoes(avaliacoes: AvaliacaoGuardada[]): string {
  const nomesSeccoesUnicos: string[] = [];
  for (const a of avaliacoes) {
    for (const s of a.grelhaSnapshot) {
      if (!nomesSeccoesUnicos.includes(s.nome)) nomesSeccoesUnicos.push(s.nome);
    }
  }

  const cabecalho = [
    "id",
    "treinador",
    "avaliador",
    "espaco",
    "data",
    "hora",
    "tipo_de_aula",
    "n_alunos",
    "classificacao_geral",
    "pontuacao_calculada_obtidos",
    "pontuacao_calculada_maximo",
    ...nomesSeccoesUnicos.flatMap((n) => [`${n} (obtidos)`, `${n} (máximo)`]),
    "confirmacao_avaliador_nome",
    "confirmacao_avaliador_data",
    "confirmacao_treinador_nome",
    "confirmacao_treinador_data",
    "comentario_geral",
  ];

  const linhas = avaliacoes.map((a) => {
    const total = totalGeralObtido(a.grelhaSnapshot, a.respostas);
    const colunasPorSeccao = nomesSeccoesUnicos.flatMap((nome) => {
      const seccao = a.grelhaSnapshot.find((s) => s.nome === nome);
      if (!seccao) return ["", ""];
      const st = subtotalSeccao(seccao, a.respostas);
      return [String(st.obtidos), String(st.max)];
    });

    return [
      a.id,
      a.cabecalho.treinador,
      a.cabecalho.avaliador,
      a.cabecalho.espaco,
      a.cabecalho.data,
      a.cabecalho.hora,
      a.cabecalho.tipoAula,
      a.cabecalho.nAlunos,
      a.classificacaoGeral,
      String(total.obtidos),
      String(total.max),
      ...colunasPorSeccao,
      a.confirmacaoAvaliador.nome,
      a.confirmacaoAvaliador.data,
      a.confirmacaoTreinador.nome,
      a.confirmacaoTreinador.data,
      a.comentarioGeral,
    ].map((v) => escaparCsv(String(v)));
  });

  return [cabecalho.map(escaparCsv).join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
}

export function transferirCsv(nomeFicheiro: string, conteudo: string) {
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFicheiro;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
