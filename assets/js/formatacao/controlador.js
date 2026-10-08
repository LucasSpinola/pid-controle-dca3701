import { numeroLatex } from './numero.js';

const RELACOES = {
  pd: { kp: 'K_c\\,z', kd: 'K_c' },
  pi: { kp: 'K_c', ki: 'K_c\\,z' },
  pid: { kp: '2K_c\\,z', ki: 'K_c\\,z^2', kd: 'K_c' },
  polo: { a: 'a', b: 'b' },
  'compensador-zero': { k: 'K', p: 'p' },
  'compensador-polo': { k: 'K', z: 'z' },
};

const SIMBOLOS = { kp: 'K_p', ki: 'K_i', kd: 'K_d', a: 'a', b: 'b', k: 'K', p: 'p', z: 'z' };

export function fatorDoZeroLatex(valor) {
  if (typeof valor === 'string') {
    return `(s + ${valor})`;
  }
  if (Math.abs(valor) < 1e-12) {
    return 's';
  }
  return valor > 0 ? `(s + ${numeroLatex(valor)})` : `(s - ${numeroLatex(-valor)})`;
}

function temFixos(controlador) {
  return (controlador.zerosFixos || []).length + (controlador.polosFixos || []).length > 0 || Boolean(controlador.fixo);
}

export function formaParalelaLatex(controlador) {
  if (controlador.polosLivres > 0 || temFixos(controlador)) {
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

function potenciaLatex(fator, expoente) {
  if (expoente === 0) {
    return '';
  }
  return expoente > 1 ? `${fator}^{${expoente}}` : fator;
}

function fatorFixoLatex(controlador, tipo) {
  const valores = tipo === 'zero' ? controlador.zerosFixos || [] : controlador.polosFixos || [];
  if (valores.length > 0) {
    return valores.map(fatorDoZeroLatex).join('');
  }
  return controlador.fixo === tipo ? `(s + ${tipo === 'zero' ? 'z' : 'p'})` : '';
}

export function formaFatoradaLatex(controlador, livre = controlador.simboloLivre, ganho = controlador.simboloGanho) {
  const fator = fatorDoZeroLatex(livre);
  const numerador = potenciaLatex(fator, controlador.zeros) + fatorFixoLatex(controlador, 'zero');
  const denominador = potenciaLatex('s', controlador.polosNaOrigem)
    + potenciaLatex(fator, controlador.polosLivres)
    + fatorFixoLatex(controlador, 'polo');

  if (!denominador) {
    return `${ganho}\\,${numerador}`;
  }
  if (!numerador) {
    return `\\dfrac{${ganho}}{${denominador}}`;
  }
  return `${ganho}\\,\\dfrac{${numerador}}{${denominador}}`;
}

export function controladorLatex(controlador) {
  if (controlador.latex) {
    return `G_c(s) = ${controlador.latex}`;
  }
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
