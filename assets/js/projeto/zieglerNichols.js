import * as P from '../nucleo/polinomio.js';
import * as C from '../nucleo/complexo.js';
import { montarMalhaAberta } from './malhaAberta.js';

const AMOSTRAS = 6000;
const PASSOS_DE_BISSECAO = 80;

function completar(linha) {
  const { kp, ti, td } = linha;
  return {
    ...linha,
    ki: Number.isFinite(ti) ? kp / ti : 0,
    kd: kp * td,
  };
}

export function primeiroMetodo(atraso, constante) {
  const razao = constante / atraso;
  return [
    { tipo: 'P', kp: razao, ti: Infinity, td: 0 },
    { tipo: 'PI', kp: 0.9 * razao, ti: atraso / 0.3, td: 0 },
    { tipo: 'PID', kp: 1.2 * razao, ti: 2 * atraso, td: 0.5 * atraso },
  ].map(completar);
}

export function segundoMetodo(ganhoCritico, periodoCritico) {
  return [
    { tipo: 'P', kp: 0.5 * ganhoCritico, ti: Infinity, td: 0 },
    { tipo: 'PI', kp: 0.45 * ganhoCritico, ti: periodoCritico / 1.2, td: 0 },
    { tipo: 'PID', kp: 0.6 * ganhoCritico, ti: 0.5 * periodoCritico, td: 0.125 * periodoCritico },
  ].map(completar);
}

function faseRelativa(numerador, denominador, omega, alvo) {
  const s = C.complexo(0, omega);
  const valor = C.dividir(P.avaliarComplexo(numerador, s), P.avaliarComplexo(denominador, s));
  const fase = C.argumentoGraus(valor) - alvo;
  return ((fase % 360) + 540) % 360 - 180;
}

export function pontoCritico(numerador, denominador) {
  const malha = montarMalhaAberta(numerador, [1], [1], denominador);
  const alvo = malha.ganho < 0 ? 0 : 180;
  const raio = Math.max(1, ...[...malha.polos, ...malha.zeros].map((p) => C.modulo(p)));
  const minimo = raio * 1e-4;
  const maximo = raio * 1e3;
  const erro = (w) => faseRelativa(malha.numerador, malha.denominador, w, alvo);

  let anterior = minimo;
  let erroAnterior = erro(anterior);
  for (let i = 1; i <= AMOSTRAS; i += 1) {
    const atual = minimo * (maximo / minimo) ** (i / AMOSTRAS);
    const erroAtual = erro(atual);
    if (Math.sign(erroAtual) !== Math.sign(erroAnterior) && Math.abs(erroAtual) < 90 && Math.abs(erroAnterior) < 90) {
      let baixo = anterior;
      let alto = atual;
      for (let k = 0; k < PASSOS_DE_BISSECAO; k += 1) {
        const meio = (baixo + alto) / 2;
        if (Math.sign(erro(meio)) === Math.sign(erro(baixo))) {
          baixo = meio;
        } else {
          alto = meio;
        }
      }
      const omega = (baixo + alto) / 2;
      const s = C.complexo(0, omega);
      const modulo = C.modulo(C.dividir(P.avaliarComplexo(malha.numerador, s), P.avaliarComplexo(malha.denominador, s)));
      return { omega, ganhoCritico: 1 / modulo, periodoCritico: (2 * Math.PI) / omega };
    }
    anterior = atual;
    erroAnterior = erroAtual;
  }
  return null;
}
