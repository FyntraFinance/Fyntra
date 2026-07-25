"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatarMoeda } from "@/lib/format";

const CORES_CATEGORIA = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#eab308",
  "#84cc16",
  "#f43f5e",
];

const COR_TICK = "#94a3b8";
const COR_GRID = "rgba(255,255,255,.05)";

const ESTILO_TOOLTIP = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 12,
  color: "#f8fafc",
  fontSize: 13,
};

function abreviarReais(valor: number) {
  return `R$ ${Number(valor).toLocaleString("pt-BR")}`;
}

function SemDados({ mensagem }: { mensagem: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <div className="empty-title">{mensagem}</div>
    </div>
  );
}

export function GraficoCategorias({
  dados,
}: {
  dados: { nome: string; valor: number }[];
}) {
  if (dados.length === 0) {
    return <SemDados mensagem="Nenhum gasto lançado neste mês" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={dados}
          dataKey="valor"
          nameKey="nome"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="none"
        >
          {dados.map((item, indice) => (
            <Cell
              key={item.nome}
              fill={CORES_CATEGORIA[indice % CORES_CATEGORIA.length]}
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={ESTILO_TOOLTIP}
          formatter={(valor: number) => formatarMoeda(valor)}
        />

        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ color: COR_TICK, fontSize: 13 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GraficoResumo({
  dados,
}: {
  dados: { nome: string; valor: number; cor: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={COR_GRID} vertical={false} />

        <XAxis
          dataKey="nome"
          tick={{ fill: COR_TICK, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: COR_TICK, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={abreviarReais}
          width={90}
        />

        <Tooltip
          cursor={{ fill: "rgba(255,255,255,.04)" }}
          contentStyle={ESTILO_TOOLTIP}
          formatter={(valor: number) => formatarMoeda(valor)}
        />

        <Bar dataKey="valor" name="Valor" radius={[12, 12, 0, 0]}>
          {dados.map((item) => (
            <Cell key={item.nome} fill={item.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoAnual({
  dados,
}: {
  dados: {
    mes: string;
    salarios: number;
    gastos: number;
    sobra: number;
  }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={dados}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke="rgba(255,255,255,.06)" />

        <XAxis
          dataKey="mes"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={abreviarReais}
          width={90}
        />

        <Tooltip
          cursor={{ fill: "rgba(255,255,255,.04)" }}
          contentStyle={ESTILO_TOOLTIP}
          formatter={(valor: number) => formatarMoeda(valor)}
        />

        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ color: "#64748b", fontSize: 13, paddingTop: 16 }}
        />

        <Bar
          dataKey="gastos"
          name="Gastos"
          fill="rgba(239,68,68,0.65)"
          radius={[6, 6, 0, 0]}
        />

        <Bar
          dataKey="sobra"
          name="Sobra"
          fill="rgba(6,182,212,0.65)"
          radius={[6, 6, 0, 0]}
        />

        <Line
          dataKey="salarios"
          name="Salários"
          type="linear"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
