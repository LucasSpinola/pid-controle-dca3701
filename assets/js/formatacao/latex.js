import { numeroLatex } from './numero.js';
import * as P from '../nucleo/polinomio.js';

const EPS = 1e-12;

export function polinomioLatex(coeficientes, variavel = 's') {
  const grau = coeficientes.length - 1;
  const partes = [];
  coeficientes.forEach((c, k) => {
    const expoente = grau - k;
    if (Math.abs(c) < EPS) {
      return;
    }
    const absoluto = Math.abs(c);
    let coeficienteTexto;
    if (expoente === 0) {
      coeficienteTexto = numeroLatex(absoluto);
    } else if (Math.abs(absoluto - 1) < EPS) {
      coeficienteTexto = '';
    } else {
      coeficienteTexto = numeroLatex(absoluto);
    }

    let termo;
    if (expoente === 0) {
      termo = coeficienteTexto;
    } else if (expoente === 1) {
      termo = coeficienteTexto ? `${coeficienteTexto}${variavel}` : variavel;
    } else {
      termo = coeficienteTexto
        ? `${coeficienteTexto}${variavel}^{${expoente}}`
        : `${variavel}^{${expoente}}`;
    }

    if (partes.length === 0) {
      partes.push(c < 0 ? `-${termo}` : termo);
    } else {
      partes.push(c < 0 ? ` - ${termo}` : ` + ${termo}`);
    }
  });
  return partes.length > 0 ? partes.join('') : '0';
}

export function razaoLatex(numerador, denominador, variavel = 's') {
  const den = P.normalizar(denominador);
  const num = polinomioLatex(numerador, variavel);
  if (den.length === 1 && Math.abs(den[0] - 1) < 1e-12) {
    return num;
  }
  return `\\frac{${num}}{${polinomioLatex(den, variavel)}}`;
}

export function complexoLatex(z, decimais = 4) {
  const re = Number(z.re.toFixed(decimais));
  const im = Number(z.im.toFixed(decimais));
  if (Math.abs(im) < 1e-10) {
    return numeroLatex(re);
  }
  if (Math.abs(re) < 1e-10) {
    if (Math.abs(Math.abs(im) - 1) < 1e-10) {
      return im > 0 ? 'j' : '-j';
    }
    return `${numeroLatex(im)}j`;
  }
  const sinal = im >= 0 ? '+' : '-';
  return `${numeroLatex(re)} ${sinal} ${numeroLatex(Math.abs(im))}j`;
}

export function rotularContribuicoes(itens, simbolo) {
  let contador = 0;
  return itens.map((item) => {
    if (item.origem === 'controlador') {
      return { ...item, rotulo: `${simbolo}_{c}` };
    }
    contador += 1;
    return { ...item, rotulo: `${simbolo}_{${contador}}` };
  });
}
