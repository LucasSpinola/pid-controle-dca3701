import { numeroLatex } from './numero.js';

const RELACOES = {
  pd: { kp: 'K_c\\,z', kd: 'K_c' },
  pi: { kp: 'K_c', ki: 'K_c\\,z' },
  pid: { kp: '2K_c\\,z', ki: 'K_c\\,z^2', kd: 'K_c' },
  polo: { a: 'a', b: 'b' },
};

const SIMBOLOS = { kp: 'K_p', ki: 'K_i', kd: 'K_d', a: 'a', b: 'b' };

export function fatorDoZeroLatex(valor) {
  if (typeof valor === 'string') {
    return `(s + ${valor})`;
  }
  if (Math.abs(valor) < 1e-12) {
    return 's';
  }
  return valor > 0 ? `(s + ${numeroLatex(valor)})` : `(s - ${numeroLatex(-valor)})`;
}

export function formaParalelaLatex(controlador) {
  if (controlador.polosLivres > 0) {
    return null;
  }
  const termos = ['K_p'];
  if (controlador.polosNaOrigem > 0) {
    termos.push('\\dfrac{K_i}{s}');
  }
  if (controlador.zeros > controlador.polosNaOrigem) {
    termos.push('K_d\\,s');
  }
  return termos.join(' + ');
}

export function formaFatoradaLatex(controlador, livre = controlador.simboloLivre, ganho = controlador.simboloGanho) {
  const fator = fatorDoZeroLatex(livre);
  if (controlador.polosLivres > 0) {
    const denominador = controlador.polosLivres > 1 ? `${fator}^{${controlador.polosLivres}}` : fator;
    return `\\dfrac{${ganho}}{${denominador}}`;
  }
  const numerador = controlador.zeros > 1 ? `${fator}^{${controlador.zeros}}` : fator;
  if (controlador.polosNaOrigem === 0) {
    return `${ganho}\\,${numerador}`;
  }
  const denominador = controlador.polosNaOrigem > 1 ? `s^{${controlador.polosNaOrigem}}` : 's';
  return `${ganho}\\,\\dfrac{${numerador}}{${denominador}}`;
}

export function controladorLatex(controlador) {
  const paralela = formaParalelaLatex(controlador);
  const fatorada = formaFatoradaLatex(controlador);
  return paralela ? `G_c(s) = ${paralela} = ${fatorada}` : `G_c(s) = ${fatorada}`;
}

export function relacoesDeGanho(controlador) {
  return Object.entries(RELACOES[controlador.id]).map(([chave, expressao]) => ({
    chave,
    simbolo: SIMBOLOS[chave],
    expressao,
  }));
}
