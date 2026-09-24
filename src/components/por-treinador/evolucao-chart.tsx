interface Ponto {
  data: string;
  classificacao: number;
}

const LARGURA = 600;
const ALTURA = 220;
const MARGEM = { topo: 16, baixo: 28, esquerda: 28, direita: 16 };

export function EvolucaoChart({ pontos }: { pontos: Ponto[] }) {
  if (pontos.length === 0) return null;

  const areaLargura = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.baixo;

  const x = (i: number) => (pontos.length === 1 ? areaLargura / 2 : (i / (pontos.length - 1)) * areaLargura) + MARGEM.esquerda;
  const y = (valor: number) => MARGEM.topo + areaAltura * (1 - valor / 100);

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.classificacao).toFixed(1)}`).join(" ");
  const niveis = [0, 25, 50, 75, 100];

  return (
    <div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Evolução da classificação geral">
        {niveis.map((n) => (
          <g key={n}>
            <line
              x1={MARGEM.esquerda}
              x2={LARGURA - MARGEM.direita}
              y1={y(n)}
              y2={y(n)}
              stroke="#e5e5e5"
              strokeWidth={1}
            />
            <text x={0} y={y(n) + 3} fontSize={10} fill="#a3a3a3">
              {n}
            </text>
          </g>
        ))}

        <path d={linha} fill="none" stroke="#000000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {pontos.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.classificacao)} r={4} fill="#000000" />
            <text x={x(i)} y={y(p.classificacao) - 10} fontSize={11} fontWeight={600} textAnchor="middle" fill="#171717">
              {p.classificacao}
            </text>
            <text x={x(i)} y={ALTURA - 8} fontSize={10} textAnchor="middle" fill="#737373">
              {p.data.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
