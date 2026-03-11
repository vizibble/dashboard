export const DEFAULT_LINE_STYLE = {
  type: "line" as const,
  smooth: true,
  symbol: "circle",
  showSymbol: true,
  symbolSize: 6,
  itemStyle: {
    color: "#3b82f6",
  },
  areaStyle: {
    color: "rgba(59,130,246,0.1)",
  },
};

export const DEFAULT_TOOLTIP = {
  trigger: "axis" as const,
  backgroundColor: "#ffffff",
  borderColor: "#e2e8f0",
  borderWidth: 1,
  textStyle: {
    color: "#0f172a",
  },
};

export const DEFAULT_GRID = {
  left: "2%",
  right: "2%",
  bottom: "8%",
  top: "16px",
  containLabel: true,
};

export const DEFAULT_X_AXIS = {
  type: "category" as const,
  axisLine: {
    lineStyle: {
      color: "#cbd5e1",
    },
  },
  axisLabel: {
    color: "#64748b",
    fontSize: 10,
  },
  splitLine: {
    show: true,
    lineStyle: {
      color: "#f1f5f9",
    },
  },
};

export const DEFAULT_Y_AXIS = {
  axisLine: {
    show: false,
  },
  axisLabel: {
    color: "#64748b",
    fontSize: 10,
  },
  splitLine: {
    show: true,
    lineStyle: {
      color: "#f1f5f9",
    },
  },
};
