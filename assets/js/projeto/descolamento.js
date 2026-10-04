import * as P from '../nucleo/polinomio.js';
import { raizes } from '../nucleo/raizes.js';

const TOLERANCIA_IMAGINARIA = 1e-6;

export function ganhosDeDescolamento(numerador, denominador) {
  const equacao = P.somar(
    P.multiplicar(numerador, P.derivar(denominador)),
    P.escalar(P.multiplicar(denominador, P.derivar(numerador)), -1),
  );

  return raizes(equacao)
    .filter((raiz) => Math.abs(raiz.im) < TOLERANCIA_IMAGINARIA)
    .map((raiz) => -P.avaliar(denominador, raiz.re) / P.avaliar(numerador, raiz.re))
    .filter((ganho) => Number.isFinite(ganho) && ganho > 0);
}
