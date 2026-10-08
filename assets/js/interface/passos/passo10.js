import { formula, paragrafo, separador, aviso } from '../componentes.js';
import { polinomioLatex, razaoLatex, complexoLatex } from '../../formatacao/latex.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';
import { ALVOS } from '../../projeto/discretizacao.js';
import * as P from '../../nucleo/polinomio.js';

export const titulo = '**Passo 10:** Discretização';
export const requerViabilidade = true;

const FOLGA_DO_CIRCULO = 1e-6;

const SINAIS = {
  controlador: { nome: 'G_c', saida: 'u', entrada: 'e' },
  malha: { nome: 'G_{MA}', saida: 'y', entrada: 'u' },
};

export function aplicavel(projeto) {
  return projeto.discretizacao !== null && projeto.discretizacao !== undefined;
}

function potenciasNegativasLatex(coeficientes) {
  const partes = [];
  coeficientes.forEach((c, i) => {
    if (Math.abs(c) < 1e-12) {
      return;
    }
    const absoluto = Math.abs(c);
    const potencia = i === 0 ? '' : `z^{-${i}}`;
    const numero = i > 0 && Math.abs(absoluto - 1) < 1e-12 ? '' : numeroLatex(absoluto);
    const termo = `${numero}${numero && potencia ? '\\,' : ''}${potencia}`;
    if (partes.length === 0) {
      partes.push(c < 0 ? `-${termo}` : termo);
    } else {
      partes.push(c < 0 ? ` - ${termo}` : ` + ${termo}`);
    }
  });
  return partes.length > 0 ? partes.join('') : '0';
}

function atrasoLatex(sinal, i) {
  return i === 0 ? `${sinal}[k]` : `${sinal}[k-${i}]`;
}

const TERMOS_POR_LINHA = 3;

function parcelasLatex(termos) {
  const partes = [];
  for (const { coeficiente, texto } of termos) {
    if (Math.abs(coeficiente) < 1e-12) {
      continue;
    }
    const absoluto = numeroLatex(Math.abs(coeficiente));
    const corpo = Math.abs(Math.abs(coeficiente) - 1) < 1e-12 ? texto : `${absoluto}\\,${texto}`;
    if (partes.length === 0) {
      partes.push(coeficiente < 0 ? `-${corpo}` : corpo);
    } else {
      partes.push(coeficiente < 0 ? ` - ${corpo}` : ` + ${corpo}`);
    }
  }
  return partes.length > 0 ? partes : ['0'];
}

function igualdadeEmLinhas(esquerda, partes) {
  if (partes.length <= TERMOS_POR_LINHA + 1) {
    return `${esquerda} = ${partes.join('')}`;
  }
  const linhas = [];
  for (let i = 0; i < partes.length; i += TERMOS_POR_LINHA) {
    linhas.push(partes.slice(i, i + TERMOS_POR_LINHA).join(''));
  }
  return `\\begin{aligned} ${esquerda} = {} & ${linhas.join(' \\\\ & ')} \\end{aligned}`;
}

function renderizarDiferencas(destino, discretizacao, sinais) {
  if (!discretizacao.causal || discretizacao.diferencas === null) {
    aviso(
      destino,
      'atencao',
      'O numerador ficou com grau maior que o denominador: a função discreta não é causal, e a saída '
      + 'dependeria de amostras futuras. Isso acontece quando a função contínua tem mais zeros que polos '
      + 'e o método não cria polos novos, como Euler para frente.',
    );
    return;
  }
  const { entrada, saida } = discretizacao.diferencas;
  const termos = [
    ...entrada.map((coeficiente, i) => ({ coeficiente, texto: atrasoLatex(sinais.entrada, i) })),
    ...saida.slice(1).map((coeficiente, i) => ({ coeficiente: -coeficiente, texto: atrasoLatex(sinais.saida, i + 1) })),
  ];
  paragrafo(destino, '**Equação de diferenças** (multiplicando cruzado e voltando ao tempo):');
  formula(destino, igualdadeEmLinhas(`${sinais.saida}[k]`, parcelasLatex(termos)));
}

function classificarPolo(item) {
  if (item.modulo < 1 - FOLGA_DO_CIRCULO) {
    return '\\text{dentro do círculo unitário}';
  }
  if (item.modulo <= 1 + FOLGA_DO_CIRCULO) {
    return '\\text{sobre o círculo unitário}';
  }
  return '\\text{fora do círculo unitário}';
}

function renderizarPolos(destino, discretizacao) {
  if (discretizacao.polos.length === 0) {
    return;
  }
  paragrafo(destino, '**Polos discretos:**');
  discretizacao.polos.forEach((item, indice) => {
    formula(
      destino,
      `z_{${indice + 1}} = ${complexoLatex(item.ponto)}, \\quad |z_{${indice + 1}}| = ${fixoLatex(item.modulo, 4)} \\quad ${classificarPolo(item)}`,
    );
  });

  const fora = discretizacao.polos.some((item) => item.modulo > 1 + FOLGA_DO_CIRCULO);
  const sobre = discretizacao.polos.some((item) => Math.abs(item.modulo - 1) <= FOLGA_DO_CIRCULO);
  if (fora && discretizacao.continuoEstavel) {
    aviso(
      destino,
      'atencao',
      `Com $T = ${numeroLatex(discretizacao.periodo)}\\,\\text{s}$, o método leva polos estáveis em $s$ para fora `
      + 'do círculo unitário: o modelo discreto é instável. Um período menor ou o método de Tustin evitam isso.',
    );
  } else if (fora) {
    aviso(destino, 'informacao', 'Há polo fora do círculo unitário, mas a função contínua já tinha polo instável.');
  } else if (sobre) {
    aviso(
      destino,
      'informacao',
      'Há polo sobre o círculo unitário. Um integrador em $s = 0$ vai para $z = 1$, e com Tustin a imagem de '
      + '$s = \\infty$ é $z = -1$, que aparece quando a função contínua tem mais zeros que polos.',
    );
  } else {
    aviso(destino, 'sucesso', 'Todos os polos ficaram dentro do círculo unitário.');
  }
}

export function renderizar(destino, projeto) {
  const { discretizacao } = projeto;
  const sinais = SINAIS[discretizacao.alvo];
  const { metodo, periodo } = discretizacao;

  paragrafo(destino, `**Função discretizada:** $${ALVOS[discretizacao.alvo]}$`);
  formula(destino, `${ALVOS[discretizacao.alvo]} = ${razaoLatex(discretizacao.numeradorS, discretizacao.denominadorS)}`);

  separador(destino);
  paragrafo(destino, `**Método:** ${metodo.nome}, com $T = ${numeroLatex(periodo)}\\,\\text{s}$`);
  formula(destino, `${metodo.substituicao} = ${razaoLatex(discretizacao.alfa, discretizacao.beta, 'z')}`);
  const beta = P.normalizar(discretizacao.beta);
  if (beta.length === 1 && Math.abs(beta[0] - 1) < 1e-12) {
    paragrafo(destino, 'Substituindo:');
  } else {
    paragrafo(
      destino,
      `Substituindo e multiplicando numerador e denominador por $(${polinomioLatex(beta, 'z')})^{${discretizacao.ordem}}$:`,
    );
  }
  formula(destino, `N(z) = ${polinomioLatex(discretizacao.numeradorSubstituido, 'z')}`);
  formula(destino, `D(z) = ${polinomioLatex(discretizacao.denominadorSubstituido, 'z')}`);
  if (discretizacao.cancelados > 0) {
    aviso(
      destino,
      'informacao',
      `Numerador e denominador tinham o fator $z${discretizacao.cancelados > 1 ? `^{${discretizacao.cancelados}}` : ''}$ em comum, que foi cancelado.`,
    );
  }

  separador(destino);
  paragrafo(destino, 'Dividindo pelo coeficiente líder do denominador:');
  formula(destino, `${sinais.nome}(z) = ${razaoLatex(discretizacao.numeradorZ, discretizacao.denominadorZ, 'z')}`);
  if (discretizacao.causal) {
    formula(
      destino,
      `${sinais.nome}(z) = \\frac{${sinais.saida.toUpperCase()}(z)}{${sinais.entrada.toUpperCase()}(z)} = \\frac{${potenciasNegativasLatex(discretizacao.diferencas.entrada)}}{${potenciasNegativasLatex(discretizacao.denominadorZ)}}`,
    );
  }
  renderizarDiferencas(destino, discretizacao, sinais);

  separador(destino);
  renderizarPolos(destino, discretizacao);
}
