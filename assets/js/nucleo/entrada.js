import * as P from './polinomio.js';

const MAIOR_EXPOENTE = 30;
const SINAIS_DE_EXPRESSAO = /[sS()^*+]/;

export function interpretarCoeficientes(texto) {
  if (typeof texto !== 'string') {
    return null;
  }
  const itens = texto.trim().split(/[\s;]+/).filter((item) => item.length > 0);
  if (itens.length === 0) {
    return null;
  }
  const valores = itens.map((item) => Number(item.replace(',', '.')));
  if (valores.some((valor) => !Number.isFinite(valor))) {
    return null;
  }
  return valores;
}

function separarSimbolos(texto) {
  const simbolos = [];
  let i = 0;
  while (i < texto.length) {
    const atual = texto[i];
    if (/\s/.test(atual)) {
      i += 1;
      continue;
    }
    const numero = /^(\d+([.,]\d*)?|[.,]\d+)/.exec(texto.slice(i));
    if (numero) {
      simbolos.push({ tipo: 'numero', valor: Number(numero[0].replace(',', '.')) });
      i += numero[0].length;
      continue;
    }
    if (atual === 's' || atual === 'S') {
      simbolos.push({ tipo: 's' });
    } else if ('+-*^()'.includes(atual)) {
      simbolos.push({ tipo: atual });
    } else {
      return null;
    }
    i += 1;
  }
  return simbolos;
}

function analisarExpressao(simbolos) {
  let posicao = 0;
  const atual = () => simbolos[posicao];
  const consumir = (tipo) => {
    if (!atual() || atual().tipo !== tipo) {
      throw new Error(`esperado ${tipo}`);
    }
    posicao += 1;
  };

  let expressao;

  function primario() {
    const simbolo = atual();
    if (!simbolo) {
      throw new Error('expressão incompleta');
    }
    if (simbolo.tipo === 'numero') {
      posicao += 1;
      return [simbolo.valor];
    }
    if (simbolo.tipo === 's') {
      posicao += 1;
      return [1, 0];
    }
    if (simbolo.tipo === '(') {
      posicao += 1;
      const interno = expressao();
      consumir(')');
      return interno;
    }
    throw new Error(`símbolo inesperado ${simbolo.tipo}`);
  }

  function potencia() {
    const base = primario();
    if (!atual() || atual().tipo !== '^') {
      return base;
    }
    posicao += 1;
    const expoente = atual();
    if (!expoente || expoente.tipo !== 'numero' || !Number.isInteger(expoente.valor) || expoente.valor > MAIOR_EXPOENTE) {
      throw new Error('expoente inválido');
    }
    posicao += 1;
    let resultado = [1];
    for (let k = 0; k < expoente.valor; k += 1) {
      resultado = P.multiplicar(resultado, base);
    }
    return resultado;
  }

  function termo() {
    let resultado = potencia();
    for (;;) {
      const simbolo = atual();
      if (simbolo && simbolo.tipo === '*') {
        posicao += 1;
        resultado = P.multiplicar(resultado, potencia());
      } else if (simbolo && ['numero', 's', '('].includes(simbolo.tipo)) {
        resultado = P.multiplicar(resultado, potencia());
      } else {
        return resultado;
      }
    }
  }

  expressao = () => {
    let resultado = [0];
    let sinal = 1;
    if (atual() && (atual().tipo === '+' || atual().tipo === '-')) {
      sinal = atual().tipo === '-' ? -1 : 1;
      posicao += 1;
    }
    resultado = P.somar(resultado, P.escalar(termo(), sinal));
    while (atual() && (atual().tipo === '+' || atual().tipo === '-')) {
      sinal = atual().tipo === '-' ? -1 : 1;
      posicao += 1;
      resultado = P.somar(resultado, P.escalar(termo(), sinal));
    }
    return resultado;
  };

  const resultado = expressao();
  if (posicao !== simbolos.length) {
    throw new Error('sobrou texto');
  }
  return resultado;
}

export function interpretarPolinomio(texto) {
  if (typeof texto !== 'string' || texto.trim() === '') {
    return null;
  }
  if (!SINAIS_DE_EXPRESSAO.test(texto)) {
    return interpretarCoeficientes(texto);
  }
  const simbolos = separarSimbolos(texto);
  if (simbolos === null || simbolos.length === 0) {
    return null;
  }
  try {
    const coeficientes = P.normalizar(analisarExpressao(simbolos));
    return coeficientes.every(Number.isFinite) ? coeficientes : null;
  } catch (falha) {
    return null;
  }
}

export function interpretarNumero(texto, padrao = 0) {
  if (typeof texto !== 'string' || texto.trim() === '') {
    return padrao;
  }
  const valor = Number(texto.trim().replace(',', '.'));
  return Number.isFinite(valor) ? valor : padrao;
}
