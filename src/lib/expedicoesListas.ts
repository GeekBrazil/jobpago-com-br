/* Listas da expedição do viajante — sem acesso ao banco, podem ir para o navegador. */

export type Idioma = "pt" | "es" | "en";
const t = (pt: string, es: string, en: string) => ({ pt, es, en });

export const MODOS: [string, Record<Idioma, string>][] = [
  ["a_pe", t("A pé", "A pie", "On foot")],
  ["bicicleta", t("Bicicleta", "Bicicleta", "Bicycle")],
  ["moto", t("Moto", "Moto", "Motorcycle")],
  ["carro", t("Carro", "Auto", "Car")],
  ["van", t("Van ou motorhome", "Van o motorhome", "Van or motorhome")],
  ["caminhao", t("Caminhão", "Camión", "Truck")],
  ["carona", t("Carona", "A dedo", "Hitchhiking")],
  ["onibus", t("Ônibus", "Ómnibus", "Bus")],
  ["misto", t("Misto", "Mixto", "Mixed")],
];
export const REDES = ["instagram", "tiktok", "youtube", "x", "facebook"] as const;
export const nomeModo = (id: string, i: Idioma = "pt") => MODOS.find(([m]) => m === id)?.[1][i] ?? id;
