/**
 * Paleta de cores vibrantes e variadas para tags e categorias
 */
const COLOR_PALETTE = [
  "#3B82F6", // Azul
  "#EF4444", // Vermelho
  "#10B981", // Verde
  "#F59E0B", // Laranja
  "#8B5CF6", // Roxo
  "#EC4899", // Rosa
  "#14B8A6", // Turquesa
  "#F97316", // Laranja Vibrante
  "#84CC16", // Lima
  "#06B6D4", // Ciano
  "#6366F1", // Índigo
  "#F43F5E", // Rosa Escuro
  "#10B981", // Esmeralda
  "#F59E0B", // Âmbar
  "#8B5CF6", // Violeta
  "#EC4899", // Fúcsia
  "#0EA5E9", // Azul Céu
  "#EAB308", // Amarelo
  "#22C55E", // Verde Claro
  "#A855F7", // Roxo Claro
];

/**
 * Gera uma cor aleatória da paleta
 * @returns Código hexadecimal da cor
 */
export const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[randomIndex];
};

/**
 * Gera uma cor que não seja igual às cores já usadas recentemente
 * @param usedColors - Array de cores já utilizadas
 * @returns Código hexadecimal da cor
 */
export const getUniqueRandomColor = (usedColors: string[] = []): string => {
  // Filtrar cores disponíveis que não foram usadas recentemente
  const availableColors = COLOR_PALETTE.filter(color => !usedColors.includes(color));
  
  // Se todas as cores foram usadas, retornar uma cor aleatória qualquer
  if (availableColors.length === 0) {
    return getRandomColor();
  }
  
  // Retornar uma cor aleatória das disponíveis
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  return availableColors[randomIndex];
};
