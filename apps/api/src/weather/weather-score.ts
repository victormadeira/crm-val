import type { WeatherCategory } from "@prisma/client";

export interface WeatherDay {
  tempMax: number;
  tempMin: number;
  precipProbability: number;
  precipSum: number;
  windspeedMax: number;
  uvIndexMax: number;
  weathercode: number;
}

/**
 * Score climático 0–100 para parque aquático no Maranhão.
 * Porta direta do Python do PRD (seção 3.1). Ponderação validada no PRD:
 * chuva > temperatura > vento > UV > weathercode.
 *
 * Mudanças em qualquer peso aqui invalidam correlações históricas já
 * persistidas — considere versionar se precisar ajustar.
 */
export function calculateWeatherScore(day: WeatherDay): {
  score: number;
  category: WeatherCategory;
} {
  let score = 100;

  // Temperatura — ideal 28–36°C
  if (day.tempMax >= 28 && day.tempMax <= 36) {
    // ideal
  } else if (day.tempMax >= 26) {
    score -= 10;
  } else if (day.tempMax >= 24) {
    score -= 22;
  } else if (day.tempMax < 24) {
    score -= 35;
  }
  if (day.tempMax > 38) score -= 8;

  // Precipitação — fator mais impactante
  if (day.precipProbability <= 10) {
    // ok
  } else if (day.precipProbability <= 25) {
    score -= 8;
  } else if (day.precipProbability <= 40) {
    score -= 18;
  } else if (day.precipProbability <= 60) {
    score -= 30;
  } else if (day.precipProbability <= 75) {
    score -= 42;
  } else {
    score -= 55;
  }

  // Volume de chuva previsto
  if (day.precipSum > 20) score -= 15;
  else if (day.precipSum > 10) score -= 8;
  else if (day.precipSum > 3) score -= 4;

  // Vento forte fecha atrações externas
  if (day.windspeedMax > 50) score -= 20;
  else if (day.windspeedMax > 40) score -= 12;
  else if (day.windspeedMax > 30) score -= 5;

  // UV — proxy de sol/nublado
  if (day.uvIndexMax < 2) score -= 12;
  else if (day.uvIndexMax < 4) score -= 6;

  // WMO weathercode — reforço p/ extremos
  // 80-99: pancadas/tempestade · 61-67: chuva contínua
  if (day.weathercode >= 80 && day.weathercode < 100) score -= 10;
  else if (day.weathercode >= 61 && day.weathercode < 68) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let category: WeatherCategory;
  if (score >= 80) category = "EXCELENTE";
  else if (score >= 60) category = "BOM";
  else if (score >= 40) category = "REGULAR";
  else if (score >= 20) category = "RUIM";
  else category = "PESSIMO";

  return { score, category };
}

export function scoreToCategory(score: number): WeatherCategory {
  if (score >= 80) return "EXCELENTE";
  if (score >= 60) return "BOM";
  if (score >= 40) return "REGULAR";
  if (score >= 20) return "RUIM";
  return "PESSIMO";
}
