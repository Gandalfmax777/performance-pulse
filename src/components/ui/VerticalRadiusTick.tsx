/**
 * Custom tick component pro PolarRadiusAxis do recharts que renderiza
 * os números do eixo radial ROTACIONADOS 90° (verticais).
 *
 * Motivação: quando o PolarRadiusAxis é plotado numa direção que coincide
 * com algum label (ex: angle=90 colidindo com "Leads" no topo), os números
 * empilhados (0, 3, 6, 9, 12) acabam sobrescrevendo o texto do label e
 * ficam ilegíveis. Rotacionar 90° faz os números virarem texto lido
 * "de lado pra cima", longe dos labels horizontais.
 *
 * Uso:
 *   <PolarRadiusAxis tick={<VerticalRadiusTick />} angle={90} />
 */
interface Props {
  x?: number;
  y?: number;
  payload?: { value: number | string };
}

export const VerticalRadiusTick = ({ x = 0, y = 0, payload }: Props) => {
  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--muted-foreground))"
      fontSize={10}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(-90, ${x}, ${y})`}
    >
      {payload?.value ?? ""}
    </text>
  );
};
