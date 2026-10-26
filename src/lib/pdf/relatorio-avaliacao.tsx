import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  Svg,
  Polygon,
  Line,
  Circle,
  Tspan,
  StyleSheet,
} from "@react-pdf/renderer";
import { Seccao } from "@/data/grelha";
import { AvaliacaoGuardada, subtotalSeccao } from "@/types/avaliacao";
import { PILARES } from "@/data/pilares";
import { AtribuicoesPilares } from "@/lib/pilares-actions";
import { percentagemPorPilar, temPilaresCategorizados } from "@/lib/pilares-notas";
import {
  BARLOW_REGULAR_DATA_URI,
  BARLOW_SEMIBOLD_DATA_URI,
  BARLOW_CONDENSED_SEMIBOLD_DATA_URI,
  BARLOW_CONDENSED_BOLD_DATA_URI,
  LOGO_CFA_DATA_URI,
} from "./pdf-assets";

Font.register({
  family: "Barlow",
  fonts: [
    { src: BARLOW_REGULAR_DATA_URI, fontWeight: "normal" },
    { src: BARLOW_SEMIBOLD_DATA_URI, fontWeight: "bold" },
  ],
});
Font.register({
  family: "Barlow Condensed",
  fonts: [
    { src: BARLOW_CONDENSED_SEMIBOLD_DATA_URI, fontWeight: "normal" },
    { src: BARLOW_CONDENSED_BOLD_DATA_URI, fontWeight: "bold" },
  ],
});

// Sem hifenização: o react-pdf só traz regras de inglês, que partem mal as palavras em português.
Font.registerHyphenationCallback((palavra) => [palavra]);

const INK = "#111111";
const LATERAL = "#141414";
const ACENTO = "#E63322";
const MUTED = "#6b6b6b";
const LATERAL_MUTED = "#9a9a9a";
const LINE = "#e6e6e6";
const TRACK = "#efefef";

const LARGURA_LATERAL = 178;
// Largura útil da coluna principal (A4 = 595pt, menos a barra lateral e as margens).
// O react-pdf parte mal o texto dentro de flex: 1 numa linha, por isso o texto do
// plano de ação leva largura fixa.
const LARGURA_PRINCIPAL = 595 - LARGURA_LATERAL - 2 * 26;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Barlow",
    fontSize: 9,
    color: INK,
    paddingTop: 28,
    paddingBottom: 32,
    paddingLeft: LARGURA_LATERAL + 26,
    paddingRight: 26,
  },
  // Absoluta e "fixed" para se repetir em todas as páginas, se o relatório passar de uma.
  lateral: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: LARGURA_LATERAL,
    backgroundColor: LATERAL,
    color: "#ffffff",
    padding: 22,
    paddingTop: 28,
  },
  condensado: { fontFamily: "Barlow Condensed", fontWeight: "bold", textTransform: "uppercase" },
  lateralLabel: {
    fontFamily: "Barlow Condensed",
    fontSize: 7.5,
    color: LATERAL_MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 10,
  },
  lateralValor: { fontSize: 10.5, fontWeight: "bold", marginTop: 1 },
  divisor: { borderTopWidth: 1, borderTopColor: "#333333" },
  bloco: { marginBottom: 18 },
  rodape: { position: "absolute", bottom: 22, left: 22, right: 22, fontSize: 7, color: "#777777" },
});

const SIZE = 170;
const CENTER = SIZE / 2;
const RAIO_MAX = 52;

function pontoRadar(indice: number, valorPct: number, raio = RAIO_MAX) {
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / PILARES.length;
  const r = (raio * Math.max(0, Math.min(100, valorPct))) / 100;
  return { x: CENTER + r * Math.cos(angulo), y: CENTER + r * Math.sin(angulo) };
}

function poligonoRadar(valores: number[]) {
  return valores
    .map((v, i) => pontoRadar(i, v))
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function SpiderWeb({ valores }: { valores: number[] }) {
  const niveis = [25, 50, 75, 100];
  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {niveis.map((n) => (
        <Polygon key={n} points={poligonoRadar(PILARES.map(() => n))} fill="none" stroke={LINE} strokeWidth={0.8} />
      ))}
      {PILARES.map((_, i) => {
        const p = pontoRadar(i, 100);
        return <Line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke={LINE} strokeWidth={0.8} />;
      })}
      <Polygon points={poligonoRadar(valores)} fill={ACENTO} fillOpacity={0.25} stroke={INK} strokeWidth={1.8} />
      {valores.map((v, i) => {
        const p = pontoRadar(i, v);
        return <Circle key={i} cx={p.x} cy={p.y} r={2.4} fill={INK} />;
      })}
      {PILARES.map((nome, i) => {
        const p = pontoRadar(i, 100, RAIO_MAX + 22);
        const partes = nome.split(" ");
        return (
          <Text key={nome} x={p.x} y={p.y} style={{ fontSize: 6.5, fontFamily: "Barlow Condensed" }} fill={MUTED} textAnchor="middle">
            {partes.map((parte, li) => (
              <Tspan key={li} x={p.x} y={p.y + (li - (partes.length - 1) / 2) * 7.5}>
                {parte}
              </Tspan>
            ))}
          </Text>
        );
      })}
    </Svg>
  );
}

function TituloSeccao({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View style={{ width: 14, height: 3, backgroundColor: ACENTO, marginRight: 6 }} />
      <Text style={[styles.condensado, { fontSize: 12, letterSpacing: 0.6 }]}>{children}</Text>
    </View>
  );
}

/** Pontos com no máximo 1 casa decimal e vírgula decimal (ex: 11,9). */
function formatarPontos(n: number) {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

export function RelatorioAvaliacaoDocument({
  avaliacao,
  atribuicoes,
}: {
  avaliacao: AvaliacaoGuardada;
  atribuicoes: AtribuicoesPilares;
}) {
  const seccoes: Seccao[] = avaliacao.grelhaSnapshot;
  const temPilares = temPilaresCategorizados(seccoes, avaliacao.respostas, atribuicoes);
  const valoresPilares = temPilares
    ? PILARES.map((p) => percentagemPorPilar(seccoes, avaliacao.respostas, p, atribuicoes))
    : [];
  const cab = avaliacao.cabecalho;
  const dadosLaterais: [string, string][] = [
    ["Avaliador", cab.avaliador],
    ["Espaço", cab.espaco],
    ["Tipo de aula", cab.tipoAula],
    ["Data", cab.data],
    ["Hora", cab.hora],
    ["Nº de alunos", cab.nAlunos],
  ];

  return (
    <Document title={`Relatório de Avaliação — ${cab.treinador}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.lateral} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, não um <img> DOM */}
          <Image src={LOGO_CFA_DATA_URI} style={{ width: 44, height: 44, marginBottom: 14 }} />
          <Text style={[styles.condensado, { fontSize: 9, color: LATERAL_MUTED, letterSpacing: 1.5 }]}>
            Avaliação de desempenho
          </Text>
          <Text style={[styles.condensado, { fontSize: 22, lineHeight: 1.05, marginTop: 4 }]}>{cab.treinador || "—"}</Text>

          <View style={[styles.divisor, { marginTop: 22, paddingTop: 14 }]}>
            <Text style={[styles.lateralLabel, { marginTop: 0 }]}>Classificação geral</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={[styles.condensado, { fontSize: 58, color: ACENTO, lineHeight: 1 }]}>
                {avaliacao.classificacaoGeral || "—"}
              </Text>
              <Text style={[styles.condensado, { fontSize: 16, color: LATERAL_MUTED, marginBottom: 8, marginLeft: 3 }]}>
                /100
              </Text>
            </View>
          </View>

          <View style={[styles.divisor, { marginTop: 14, paddingTop: 4 }]}>
            {dadosLaterais.map(([label, valor]) => (
              <View key={label}>
                <Text style={styles.lateralLabel}>{label}</Text>
                <Text style={styles.lateralValor}>{valor || "—"}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.rodape}>
            CFA Avaliações · {new Date().toLocaleDateString("pt-PT")}
            {"\n"}#{avaliacao.id}
          </Text>
        </View>

        {avaliacao.comentarioGeral.trim() !== "" && (
          <View style={[styles.bloco, { borderLeftWidth: 3, borderLeftColor: ACENTO, paddingLeft: 10 }]}>
            <Text style={[styles.condensado, { fontSize: 8, color: MUTED, letterSpacing: 1 }]}>Comentário geral</Text>
            <Text style={{ fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>{avaliacao.comentarioGeral}</Text>
          </View>
        )}

        {temPilares && (
          <View style={styles.bloco} wrap={false}>
            <TituloSeccao>Notas por pilar</TituloSeccao>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <SpiderWeb valores={valoresPilares} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                {PILARES.map((pilar, i) => (
                  <View
                    key={pilar}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 3,
                      borderBottomWidth: 0.5,
                      borderBottomColor: LINE,
                    }}
                  >
                    <Text>{pilar}</Text>
                    <Text style={{ fontWeight: "bold" }}>{Math.round(valoresPilares[i])}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.bloco}>
          <TituloSeccao>Por parte da aula</TituloSeccao>
          {seccoes.map((seccao) => {
            const st = subtotalSeccao(seccao, avaliacao.respostas);
            const pct = st.max > 0 ? (st.obtidos / st.max) * 100 : 0;
            const obs = avaliacao.observacoes[seccao.id]?.trim() ?? "";
            return (
              <View key={seccao.id} style={{ marginBottom: 7 }} wrap={false}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontWeight: "bold" }}>{seccao.nome}</Text>
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>{formatarPontos(st.obtidos)}</Text>
                    <Text style={{ color: MUTED }}> / {formatarPontos(st.max)}</Text>
                  </Text>
                </View>
                <View style={{ height: 5, backgroundColor: TRACK }}>
                  <View
                    style={{
                      height: 5,
                      width: `${pct}%`,
                      backgroundColor: pct >= 75 ? INK : pct >= 50 ? "#555555" : ACENTO,
                    }}
                  />
                </View>
                {obs !== "" && <Text style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>{obs}</Text>}
              </View>
            );
          })}
        </View>

        {avaliacao.planoAcao.length > 0 && (
          <View style={styles.bloco}>
            <TituloSeccao>Prioridades &amp; Plano de Ação</TituloSeccao>
            {avaliacao.planoAcao.map((item, i) => (
              <View key={item.origem} style={{ flexDirection: "row", marginBottom: 8 }} wrap={false}>
                <Text style={[styles.condensado, { fontSize: 18, color: ACENTO, width: 22, lineHeight: 1 }]}>{i + 1}</Text>
                <View style={{ width: LARGURA_PRINCIPAL - 22 }}>
                  <Text style={[styles.condensado, { fontSize: 9.5, letterSpacing: 0.4 }]}>{item.origem}</Text>
                  <Text style={{ fontSize: 9, lineHeight: 1.4, marginTop: 1 }}>{item.texto}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
