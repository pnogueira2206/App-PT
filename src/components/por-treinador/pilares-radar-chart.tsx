import { PILARES } from "@/data/pilares";

const SIZE = 320;
const CENTER = SIZE / 2;
const RAIO_MAX = 108;
const NIVEIS = [25, 50, 75, 100];

function ponto(indice: number, valorPct: number) {
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / PILARES.length;
  const r = (RAIO_MAX * Math.max(0, Math.min(100, valorPct))) / 100;
  return { x: CENTER + r * Math.cos(angulo), y: CENTER + r * Math.sin(angulo) };
}

function poligono(valores: number[]) {
  return valores.map((v, i) => ponto(i, v)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function labelPos(indice: number) {
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / PILARES.length;
  const r = RAIO_MAX + 26;
  return { x: CENTER + r * Math.cos(angulo), y: CENTER + r * Math.sin(angulo) };
}

export function PilaresRadarChart({
  ultima,
  anterior,
}: {
  ultima: number[];
  anterior: number[] | null;
}) {
  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" role="img" aria-label="Notas por pilar: última avaliação vs. anterior">
        {NIVEIS.map((n) => (
          <polygon
            key={n}
            points={poligono(PILARES.map(() => n))}
            fill="none"
            stroke="#262626"
            strokeWidth={1}
          />
        ))}

        {PILARES.map((_, i) => {
          const p = ponto(i, 100);
          return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#262626" strokeWidth={1} />;
        })}

        {anterior && (
          <polygon
            points={poligono(anterior)}
            fill="none"
            stroke="#595959"
            strokeWidth={2}
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        )}

        <polygon points={poligono(ultima)} fill="#ffffff" fillOpacity={0.1} stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
        {ultima.map((v, i) => {
          const p = ponto(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#ffffff" />;
        })}

        {PILARES.map((nome, i) => {
          const p = labelPos(i);
          const partes = nome.split(" ");
          return (
            <text
              key={nome}
              x={p.x}
              y={p.y}
              fontSize={10.5}
              fontWeight={600}
              textAnchor="middle"
              fill="#a3a3a3"
              fontFamily="var(--font-jetbrains-mono)"
            >
              {partes.map((parte, li) => (
                <tspan key={li} x={p.x} dy={li === 0 ? 0 : 12}>
                  {parte}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-none bg-white" /> Última avaliação
        </span>
        {anterior && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3.5 border-t-2 border-dashed border-line" /> Anterior
          </span>
        )}
      </div>
    </div>
  );
}
