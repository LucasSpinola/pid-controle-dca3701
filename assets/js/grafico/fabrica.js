import { Plano, areaDoPlano, dimensoesParaProporcao } from './plano.js';
import { limitesBrutos, equalizarEscala } from './janela.js';

export const LIMITES_COMPACTOS = {
  larguraMaxima: 322,
  larguraMinima: 236,
  alturaMinima: 208,
  alturaMaxima: 288,
  margem: { esquerda: 28, direita: 12, topo: 10, base: 24 },
  compacto: true,
};

const EIXOS_DO_TEMPO = { x: 'Tempo (s)', y: 'Saída y(t)' };
const PROPORCAO_DO_TEMPO = 1.9;
const FOLGA_VERTICAL = 0.08;

export function criarPlano(pontos, titulo, opcoes = {}) {
  const base = limitesBrutos(pontos);
  const proporcao = (base.xMax - base.xMin) / (base.yMax - base.yMin);
  const dimensoes = dimensoesParaProporcao(proporcao, opcoes.limites);
  const area = areaDoPlano(dimensoes);
  const plano = new Plano(equalizarEscala(base, area.largura, area.altura), titulo, dimensoes);

  if (opcoes.semLegenda) {
    plano.legendaAtiva = false;
  }
  return plano;
}

export function criarGraficoTemporal(duracao, minimo, maximo, titulo) {
  const inferior = Math.min(0, minimo);
  const superior = Math.max(0, maximo);
  const folga = Math.max(superior - inferior, 1e-9) * FOLGA_VERTICAL;
  const janela = { xMin: 0, xMax: duracao, yMin: inferior - folga, yMax: superior + folga };
  return new Plano(janela, titulo, dimensoesParaProporcao(PROPORCAO_DO_TEMPO), EIXOS_DO_TEMPO);
}
