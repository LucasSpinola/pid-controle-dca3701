import { formula, paragrafo, separador, aviso } from '../componentes.js';
import { complexoLatex, rotularContribuicoes } from '../../formatacao/latex.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 6:** Critério de módulo e $K_c$';
export const requerViabilidade = true;

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
  const { modulo, desempenho } = projeto;
  const polo = desempenho.polo;
  const polos = rotularContribuicoes(modulo.distanciasPolos, 'p');
  const zeros = rotularContribuicoes(modulo.distanciasZeros, 'z');

  paragrafo(destino, '**Condição de módulo em $s_d$:**');
  formula(destino, '|K_c\\,P(s_d)| = 1 \\;\\Longrightarrow\\; K_c = \\frac{\\prod |s_d - p_i|}{|k|\\,\\prod |s_d - z_j|}');
  paragrafo(
    destino,
    'Agora o zero do controlador ($z_c$) entra no produto, junto com os polos e zeros da planta.',
  );

  separador(destino);
  paragrafo(destino, '**Distâncias aos polos:**');
  listarDistancias(destino, polos, polo);
  formula(destino, `\\prod |s_d - p_i| = ${produtoLatex(polos)} = ${fixoLatex(modulo.produtoPolos, 4)}`);

  paragrafo(destino, '**Distâncias aos zeros:**');
  listarDistancias(destino, zeros, polo);
  formula(destino, `\\prod |s_d - z_j| = ${produtoLatex(zeros)} = ${fixoLatex(modulo.produtoZeros, 4)}`);

  separador(destino);
  paragrafo(destino, '**Resultado:**');
  formula(
    destino,
    `K_c = \\frac{${fixoLatex(modulo.produtoPolos, 4)}}{${numeroLatex(modulo.ganhoDaPlanta)} \\cdot ${fixoLatex(modulo.produtoZeros, 4)}} = ${numeroLatex(modulo.kc)}`,
  );
  aviso(destino, 'sucesso', `$K_c = ${numeroLatex(modulo.kc)}$`);
}
