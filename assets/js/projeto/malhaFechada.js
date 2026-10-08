import * as P from '../nucleo/polinomio.js';
import * as C from '../nucleo/complexo.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';
import { numeradorDoControlador, denominadorDoControlador } from './controladores.js';

export const RAZAO_DE_DOMINANCIA = 5;
const TOLERANCIA_RELATIVA = 1e-3;

function classificar(polo, desejado, zeros, escala) {
  const tolerancia = TOLERANCIA_RELATIVA * escala;
  if (polo.re >= -1e-9) {
    return 'instavel';
  }
  if (C.distancia(polo, desejado) < tolerancia || C.distancia(polo, C.conjugado(desejado)) < tolerancia) {
    return 'desejado';
  }
  if (zeros.some((zero) => C.distancia(polo, zero) < tolerancia)) {
    return 'cancelado';
  }
  if (polo.re <= desejado.re * RAZAO_DE_DOMINANCIA) {
    return 'rapido';
  }
  return 'influente';
}

export function analisarMalhaFechada(entrada, controlador, zero, kc, desejado) {
  const { nG, dG, nH, dH } = entrada;
  const numeradorControlador = P.escalar(numeradorDoControlador(controlador, zero.valor), kc);
  const denominadorControlador = denominadorDoControlador(controlador, zero.valor);

  const numeradorDireto = P.multiplicar(numeradorControlador, nG);
  const numeradorAberto = P.multiplicar(numeradorDireto, nH);
  const denominadorAberto = P.multiplicar(P.multiplicar(denominadorControlador, dG), dH);

  const caracteristica = P.normalizar(P.somar(denominadorAberto, numeradorAberto));
  const numerador = P.normalizar(P.multiplicar(numeradorDireto, dH));
  const zeros = ordenarParaExibicao(raizes(numerador));
  const encontrados = ordenarParaExibicao(raizes(caracteristica));

  const escala = [...encontrados, desejado].reduce((maior, z) => Math.max(maior, C.modulo(z)), 1);
  const polos = encontrados.map((ponto) => ({
    ponto,
    classe: classificar(ponto, desejado, zeros, escala),
    razao: ponto.re / desejado.re,
  }));

  return {
    numeradorControlador,
    denominadorControlador,
    numeradorAberto: P.normalizar(numeradorAberto),
    denominadorAberto: P.normalizar(denominadorAberto),
    caracteristica,
    numerador,
    zeros,
    polos,
    estavel: polos.every((item) => item.classe !== 'instavel'),
    dominante: polos.every((item) => ['desejado', 'cancelado', 'rapido'].includes(item.classe)),
  };
}
