import { formula, paragrafo, separador, aviso } from '../componentes.js';
import { complexoLatex, rotularContribuicoes } from '../../formatacao/latex.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 6:** Critério de módulo e $K_c$';
export const abertoPorPadrao = true;
export const requerViabilidade = true;

export function tituloPara(projeto) {
  return `**Passo 6:** Critério de módulo e $${projeto.controlador.simboloGanho}$`;
}

function listarDistancias(destino, itens, polo) {
  for (const item of itens) {
    formula(
      destino,
      `\\lvert s_d - ${item.rotulo} \\rvert = \\lvert ${complexoLatex(polo)} - (${complexoLatex(item.referencia)}) \\rvert = \\lvert ${complexoLatex(item.diferenca)} \\rvert = ${fixoLatex(item.valor, 4)}`,
    );
  }
}

function produtoLatex(itens) {
  return itens.map((item) => fixoLatex(item.valor, 4)).join(' \\cdot ');
}

export function renderizar(destino, projeto) {
  const { modulo, desempenho, controlador } = projeto;
  const ganho = controlador.simboloGanho;
  const polo = desempenho.polo;
  const polos = rotularContribuicoes(modulo.distanciasPolos, 'p');
  const zeros = rotularContribuicoes(modulo.distanciasZeros, 'z');

  paragrafo(destino, '**Condição de módulo em $s_d$:**');
  formula(
    destino,
    `|${ganho}\\,P(s_d)| = 1 \\;\\Longrightarrow\\; ${ganho} = \\frac{\\prod |s_d - p_i|}{|k|\\,\\prod |s_d - z_j|}`,
  );
  paragrafo(
    destino,
    controlador.polosLivres > 0
      ? 'Agora o polo do controlador ($p_c$) entra no produto, junto com os polos e zeros da planta.'
      : 'Agora o zero do controlador ($z_c$) entra no produto, junto com os polos e zeros da planta.',
  );

  separador(destino);
  paragrafo(destino, '**Distâncias aos polos:**');
  listarDistancias(destino, polos, polo);
  formula(destino, `\\prod |s_d - p_i| = ${produtoLatex(polos)} = ${fixoLatex(modulo.produtoPolos, 4)}`);

  if (zeros.length > 0) {
    paragrafo(destino, '**Distâncias aos zeros:**');
    listarDistancias(destino, zeros, polo);
    formula(destino, `\\prod |s_d - z_j| = ${produtoLatex(zeros)} = ${fixoLatex(modulo.produtoZeros, 4)}`);
  } else {
    paragrafo(destino, 'Sem zeros finitos: $\\prod |s_d - z_j| = 1$.');
  }

  separador(destino);
  paragrafo(destino, '**Ganho total** da malha em $s_d$:');
  const ganhoTotal = modulo.produtoPolos / modulo.produtoZeros;
  formula(
    destino,
    `K_t = \\frac{\\prod |s_d - p_i|}{\\prod |s_d - z_j|} = \\frac{${fixoLatex(modulo.produtoPolos, 4)}}{${fixoLatex(modulo.produtoZeros, 4)}} = ${numeroLatex(ganhoTotal)}`,
  );
  paragrafo(
    destino,
    `Como $G(s)H(s)$ já tem ganho $k = ${numeroLatex(modulo.ganhoDaPlanta)}$, o ganho do controlador é:`,
  );
  formula(
    destino,
    `${ganho} = \\frac{K_t}{|k|} = \\frac{${numeroLatex(ganhoTotal)}}{${numeroLatex(modulo.ganhoDaPlanta)}} = ${numeroLatex(modulo.kc)}`,
  );
  aviso(destino, 'sucesso', `$${ganho} = ${numeroLatex(modulo.kc)}$`);
}
