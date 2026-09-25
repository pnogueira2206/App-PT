import path from "node:path";
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
import { AvaliacaoGuardada, dimensoesDaSeccao, subtotalDimensao, subtotalSeccao } from "@/types/avaliacao";
import { PILARES } from "@/data/pilares";
import { AtribuicoesPilares } from "@/lib/pilares-actions";
import { percentagemPorPilar, temPilaresCategorizados } from "@/lib/pilares-notas";

const FONTS_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

Font.register({
  family: "JetBrains Mono",
  fonts: [
    { src: path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf"), fontWeight: "bold" },
  ],
});

const INK = "#171717";
const MUTED = "#737373";
const DIM = "#a3a3a3";
const LINE = "#e5e5e5";

const styles = StyleSheet.create({
  page: {
    fontFamily: "JetBrains Mono",
    fontSize: 9,
    color: INK,
    padding: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 2,
    borderBottomColor: INK,
    paddingBottom: 10,
    marginBottom: 16,
  },
  logo: { width: 30, height: 30 },
  titulo: { fontSize: 13, fontWeight: "bold", letterSpacing: 0.5 },
  subtitulo: { fontSize: 8, color: MUTED, marginTop: 2, letterSpacing: 0.5 },
  secao: {
    borderWidth: 1,
    borderColor: LINE,
    padding: 10,
    marginBottom: 10,
  },
  secaoTitulo: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  label: { color: MUTED },
  valor: { fontWeight: "bold" },
  grelhaCabecalho: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  campoCabecalho: { width: "50%", paddingVertical: 3, paddingRight: 8 },
  classificacaoGrande: { fontSize: 28, fontWeight: "bold" },
  classificacaoLabel: { fontSize: 8, color: MUTED, marginTop: 2 },
  dimLinha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1, paddingLeft: 8 },
  comentario: { fontSize: 8, color: MUTED, marginTop: 6, fontStyle: "italic" },
  prioridade: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  prioridadeOrigem: { fontSize: 9, fontWeight: "bold", marginBottom: 2 },
  prioridadeTexto: { fontSize: 9 },
  rodape: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: DIM,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
  },
});

const SIZE = 210;
const CENTER = SIZE / 2;
const RAIO_MAX = 65;

function pontoRadar(indice: number, valorPct: number) {
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / PILARES.length;
  const r = (RAIO_MAX * Math.max(0, Math.min(100, valorPct))) / 100;
  return { x: CENTER + r * Math.cos(angulo), y: CENTER + r * Math.sin(angulo) };
}

function poligonoRadar(valores: number[]) {
  return valores
    .map((v, i) => pontoRadar(i, v))
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function labelPosRadar(indice: number) {
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / PILARES.length;
  const r = RAIO_MAX + 22;
  return { x: CENTER + r * Math.cos(angulo), y: CENTER + r * Math.sin(angulo) };
}

function SpiderWeb({ valores }: { valores: number[] }) {
  const niveis = [25, 50, 75, 100];
  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {niveis.map((n) => (
        <Polygon key={n} points={poligonoRadar(PILARES.map(() => n))} fill="none" stroke={LINE} strokeWidth={1} />
      ))}
      {PILARES.map((_, i) => {
        const p = pontoRadar(i, 100);
        return <Line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke={LINE} strokeWidth={1} />;
      })}
      <Polygon points={poligonoRadar(valores)} fill={INK} fillOpacity={0.12} stroke={INK} strokeWidth={2} />
      {valores.map((v, i) => {
        const p = pontoRadar(i, v);
        return <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={INK} />;
      })}
      {PILARES.map((nome, i) => {
        const p = labelPosRadar(i);
        const partes = nome.split(" ");
        return (
          <Text key={nome} x={p.x} y={p.y} style={{ fontSize: 7, fontWeight: "bold" }} fill={DIM} textAnchor="middle">
            {partes.map((parte, li) => (
              <Tspan key={li} x={p.x} y={p.y + (li - (partes.length - 1) / 2) * 8}>
                {parte}
              </Tspan>
            ))}
          </Text>
        );
      })}
    </Svg>
  );
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

  const logoPath = path.join(process.cwd(), "public/logo-cfa.jpg");

  return (
    <Document title={`Relatório de Avaliação — ${avaliacao.cabecalho.treinador}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, não um <img> DOM */}
          <Image src={logoPath} style={styles.logo} />
          <View>
            <Text style={styles.titulo}>CFA AVALIAÇÕES</Text>
            <Text style={styles.subtitulo}>RELATÓRIO DE AVALIAÇÃO DE DESEMPENHO</Text>
          </View>
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Cabeçalho</Text>
          <View style={styles.grelhaCabecalho}>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Treinador</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.treinador || "—"}</Text>
            </View>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Avaliador</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.avaliador || "—"}</Text>
            </View>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Espaço</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.espaco || "—"}</Text>
            </View>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Tipo de aula</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.tipoAula || "—"}</Text>
            </View>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Data</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.data || "—"}</Text>
            </View>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Hora</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.hora || "—"}</Text>
            </View>
            <View style={styles.campoCabecalho}>
              <Text style={styles.label}>Nº de alunos</Text>
              <Text style={styles.valor}>{avaliacao.cabecalho.nAlunos || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[styles.secao, { flex: 1 }]}>
            <Text style={styles.secaoTitulo}>Classificação Geral</Text>
            <Text style={styles.classificacaoGrande}>{avaliacao.classificacaoGeral || "—"}/100</Text>
            {avaliacao.comentarioGeral.trim() && <Text style={styles.comentario}>&quot;{avaliacao.comentarioGeral}&quot;</Text>}
          </View>
          {temPilares && (
            <View style={[styles.secao, { alignItems: "center" }]}>
              <Text style={styles.secaoTitulo}>Notas por Pilar</Text>
              <SpiderWeb valores={valoresPilares} />
            </View>
          )}
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Discriminação por Parte da Aula</Text>
          {seccoes.map((seccao) => {
            const st = subtotalSeccao(seccao, avaliacao.respostas);
            const dims = dimensoesDaSeccao(seccao);
            return (
              <View key={seccao.id} style={{ marginBottom: 6 }}>
                <View style={styles.linha}>
                  <Text style={{ fontWeight: "bold" }}>{seccao.nome}</Text>
                  <Text style={styles.valor}>
                    {st.obtidos} / {st.max}
                  </Text>
                </View>
                {dims.map((dim) => {
                  const dst = subtotalDimensao(seccao, dim, avaliacao.respostas);
                  return (
                    <View key={dim} style={styles.dimLinha}>
                      <Text style={styles.label}>{dim}</Text>
                      <Text>
                        {dst.obtidos} / {dst.max}
                      </Text>
                    </View>
                  );
                })}
                {avaliacao.observacoes[seccao.id]?.trim() && (
                  <Text style={styles.comentario}>&quot;{avaliacao.observacoes[seccao.id]}&quot;</Text>
                )}
              </View>
            );
          })}
        </View>

        {avaliacao.planoAcao.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Prioridades &amp; Plano de Ação</Text>
            {avaliacao.planoAcao.map((item) => (
              <View key={item.origem} style={styles.prioridade}>
                <Text style={styles.prioridadeOrigem}>{item.origem}</Text>
                <Text style={styles.prioridadeTexto}>{item.texto}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.rodape}>
          CFA Avaliações · Gerado em {new Date().toLocaleDateString("pt-PT")} · Avaliação #{avaliacao.id}
        </Text>
      </Page>
    </Document>
  );
}
