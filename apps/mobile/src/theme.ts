/**
 * Tokens do Valparaíso Adventure Park (grid 5px, paleta dark-green + red).
 * Mantidos em um único arquivo para evitar múltiplas fontes de verdade e
 * facilitar importação em qualquer screen.
 */
export const theme = {
  colors: {
    background: "#006938",
    surface: "#333333",
    surfaceAlt: "#444444",
    border: "#444444",
    textPrimary: "#ffffff",
    textMuted: "#dddddd",
    textFaint: "#888888",
    accent: "#ff0030",
    warning: "#ffaa00",
    danger: "#ff5e26",
    success: "#94c93b",
  },
  spacing: (n: number) => n * 5,
  radius: {
    sm: 5,
    md: 10,
    lg: 20,
  },
  font: {
    regular: "System",
    bold: "System",
  },
} as const;
