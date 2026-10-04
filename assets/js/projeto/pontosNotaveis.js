import * as C from '../nucleo/complexo.js';

function acrescentar(destino, lista) {
  for (const ponto of lista || []) {
    if (ponto && Number.isFinite(ponto.re) && Number.isFinite(ponto.im)) {
      destino.push({ re: ponto.re, im: ponto.im });
    }
  }
}

export function pontosNotaveis(projeto, opcoes = {}) {
  const pontos = [];
  acrescentar(pontos, projeto.malhaAberta.polos);
  acrescentar(pontos, projeto.malhaAberta.zeros);

  if (projeto.desempenho) {
    acrescentar(pontos, [projeto.desempenho.polo, C.conjugado(projeto.desempenho.polo)]);
  }

  if (opcoes.poloDoControlador !== false && projeto.controlador && projeto.controlador.polosNaOrigem > 0) {
    acrescentar(pontos, [C.complexo(0)]);
  }

  if (opcoes.zeroDoControlador !== false && projeto.zero) {
    acrescentar(pontos, [projeto.zero.ponto]);
  }

  if (opcoes.malhaFechada && projeto.malhaFechada) {
    acrescentar(pontos, projeto.malhaFechada.polos.map((item) => item.ponto));
    acrescentar(pontos, projeto.malhaFechada.zeros);
  }

  return pontos;
}

export function raioDeInteresse(pontos) {
  let maior = 1;
  for (const ponto of pontos) {
    maior = Math.max(maior, Math.hypot(ponto.re, ponto.im));
  }
  return maior;
}
