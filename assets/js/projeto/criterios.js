import * as C from '../nucleo/complexo.js';
import {
  livreEhPolo,
  quantidadeLivre,
  zerosFixosComoPontos,
  polosFixosComoPontos,
} from './controladores.js';

const FOLGA_ANGULAR = 1e-6;

export function paraCircunferencia(valor) {
  return ((valor % 360) + 360) % 360;
}

function contribuicaoAngular(ponto, referencia, origem) {
  const diferenca = C.subtrair(ponto, referencia);
  return { referencia, origem, diferenca, angulo: C.argumentoGraus(diferenca) };
}

function contribuicaoDeModulo(ponto, referencia, origem) {
  const diferenca = C.subtrair(ponto, referencia);
  return { referencia, origem, diferenca, valor: C.modulo(diferenca) };
}

function polosDoConjunto(malhaAberta, controlador, livre = null) {
  const livres = livre ? new Array(controlador.polosLivres).fill(livre) : [];
  return [
    ...malhaAberta.polos.map((p) => ({ ponto: p, origem: 'planta' })),
    ...[...polosFixosComoPontos(controlador), ...livres].map((p) => ({ ponto: p, origem: 'controlador' })),
  ];
}

function zerosConhecidos(malhaAberta, controlador) {
  return [
    ...malhaAberta.zeros.map((z) => ({ ponto: z, origem: 'planta' })),
    ...zerosFixosComoPontos(controlador).map((z) => ({ ponto: z, origem: 'controlador' })),
  ];
}

function motivoDeInviabilidade(porSingularidade) {
  if (porSingularidade < FOLGA_ANGULAR || 360 - porSingularidade < FOLGA_ANGULAR) {
    return 'semDeficiencia';
  }
  if (porSingularidade >= 180 - FOLGA_ANGULAR) {
    return 'excesso';
  }
  return null;
}

export function criterioDeAngulo(polo, malhaAberta, controlador) {
  const contribuicaoZeros = zerosConhecidos(malhaAberta, controlador)
    .map((item) => contribuicaoAngular(polo, item.ponto, item.origem));
  const contribuicaoPolos = polosDoConjunto(malhaAberta, controlador)
    .map((item) => contribuicaoAngular(polo, item.ponto, item.origem));

  const somaZeros = contribuicaoZeros.reduce((total, item) => total + item.angulo, 0);
  const somaPolos = contribuicaoPolos.reduce((total, item) => total + item.angulo, 0);
  const anguloDoGanho = malhaAberta.ganho < 0 ? 180 : 0;
  const fase = somaZeros - somaPolos + anguloDoGanho;
  const deficiencia = paraCircunferencia(-180 - fase);
  const exigido = livreEhPolo(controlador) ? paraCircunferencia(-deficiencia) : deficiencia;
  const porSingularidade = exigido / quantidadeLivre(controlador);
  const motivo = motivoDeInviabilidade(porSingularidade);

  return {
    contribuicaoZeros,
    contribuicaoPolos,
    somaZeros,
    somaPolos,
    anguloDoGanho,
    fase,
    deficiencia,
    exigido,
    porSingularidade,
    viavel: motivo === null,
    motivo,
  };
}

export function localizarZero(polo, angulo) {
  const sigma = -polo.re;
  const tangente = Math.tan((angulo.porSingularidade * Math.PI) / 180);
  const afastamento = polo.im / tangente;
  const valor = sigma + afastamento;
  return {
    sigma,
    omegaD: polo.im,
    tangente,
    afastamento,
    valor,
    ponto: C.complexo(-valor),
    semiplanoDireito: valor < 0,
  };
}

export function criterioDeModulo(polo, malhaAberta, controlador, zero) {
  const zerosDoControlador = new Array(controlador.zeros).fill(zero.ponto);
  const distanciasZeros = [
    ...zerosConhecidos(malhaAberta, controlador).map((item) => contribuicaoDeModulo(polo, item.ponto, item.origem)),
    ...zerosDoControlador.map((z) => contribuicaoDeModulo(polo, z, 'controlador')),
  ];
  const distanciasPolos = polosDoConjunto(malhaAberta, controlador, zero.ponto)
    .map((item) => contribuicaoDeModulo(polo, item.ponto, item.origem));

  const produtoZeros = distanciasZeros.reduce((total, item) => total * item.valor, 1);
  const produtoPolos = distanciasPolos.reduce((total, item) => total * item.valor, 1);
  const ganhoDaPlanta = Math.abs(malhaAberta.ganho);

  return {
    distanciasZeros,
    distanciasPolos,
    produtoZeros,
    produtoPolos,
    ganhoDaPlanta,
    kc: produtoPolos / (ganhoDaPlanta * produtoZeros),
  };
}
