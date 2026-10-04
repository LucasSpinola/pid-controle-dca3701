import { secao } from './componentes.js';
import { montarBarraDeResultado } from './ferramentas.js';
import { passos } from './passos/indice.js';
import * as graficoCompleto from './passos/graficoCompleto.js';

export function renderizarResultado(destino, projeto) {
  montarBarraDeResultado(destino);
  for (const passo of passos) {
    if (passo.requerViabilidade && !projeto.viavel) {
      break;
    }
    const corpo = secao(destino, passo.titulo, passo.abertoPorPadrao === true);
    passo.renderizar(corpo, projeto);
  }
  if (projeto.viavel) {
    graficoCompleto.renderizar(destino, projeto);
  }
}
