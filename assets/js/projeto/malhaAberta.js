import * as P from '../nucleo/polinomio.js';
import * as C from '../nucleo/complexo.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';

const TOLERANCIA_DE_CANCELAMENTO = 1e-6;

function cancelamentos(polos, zeros) {
  const escala = [...polos, ...zeros].reduce((maior, z) => Math.max(maior, C.modulo(z)), 1);
  const usados = new Set();
  const pares = [];
  for (const polo of polos) {
    const indice = zeros.findIndex((zero, j) => !usados.has(j)
      && C.distancia(polo, zero) < TOLERANCIA_DE_CANCELAMENTO * escala);
    if (indice >= 0) {
      usados.add(indice);
      pares.push(polo);
    }
  }
  return pares;
}

export function montarMalhaAberta(nG, dG, nH, dH) {
  const numerador = P.normalizar(P.multiplicar(nG, nH));
  const denominador = P.normalizar(P.multiplicar(dG, dH));
  const zeros = ordenarParaExibicao(raizes(numerador));
  const polos = ordenarParaExibicao(raizes(denominador));

  return {
    numerador,
    denominador,
    zeros,
    polos,
    ganho: numerador[0] / denominador[0],
    cancelamentos: cancelamentos(polos, zeros),
  };
}
