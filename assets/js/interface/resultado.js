import { elemento, formula, paragrafo, secao } from './componentes.js';
import { montarBarraDeResultado } from './ferramentas.js';
import { passos } from './passos/indice.js';
import * as graficoCompleto from './passos/graficoCompleto.js';
import { razaoLatex } from '../formatacao/latex.js';
import { numeroLatex } from '../formatacao/numero.js';
import { controladorLatex } from '../formatacao/controlador.js';
import { METODOS, ALVOS } from '../projeto/discretizacao.js';

function especificacaoLatex(especificacao) {
  if (especificacao.modo === 'desempenho') {
    return `M_P \\le ${numeroLatex(especificacao.sobressinal)}\\%, \\qquad t_s(${especificacao.criterio}\\%) < ${numeroLatex(especificacao.acomodacao)}\\,\\text{s}`;
  }
  if (especificacao.modo === 'amortecimento') {
    return `\\zeta = ${numeroLatex(especificacao.zeta)}, \\qquad \\omega_n = ${numeroLatex(especificacao.omegaN)}\\,\\text{rad/s}`;
  }
  return `s_d = ${numeroLatex(especificacao.real)} \\pm ${numeroLatex(especificacao.imaginario)}\\,j`;
}

export function tituloDoArquivo(projeto, questao) {
  if (questao) {
    return `${questao.exercicio} - ${questao.nome}`;
  }
  return `Projeto ${projeto.controlador.polosLivres > 0 ? 'a-(s+b)' : projeto.controlador.nome}`;
}

function montarCabecalho(destino, projeto, questao) {
  const { entrada, controlador } = projeto;
  const bloco = elemento('section', 'enunciado');
  bloco.appendChild(elemento('p', 'enunciado-etiqueta', questao ? `${questao.exercicio} · ${questao.nome}` : 'Dados do projeto'));

  for (const texto of questao?.enunciado || []) {
    paragrafo(bloco, texto);
  }

  const dados = elemento('div', 'enunciado-dados');
  formula(dados, `G(s) = ${razaoLatex(entrada.nG, entrada.dG)}, \\qquad H(s) = ${razaoLatex(entrada.nH, entrada.dH)}`);
  formula(dados, controladorLatex(controlador));
  formula(dados, especificacaoLatex(entrada.especificacao));
  if (entrada.discretizacao) {
    const { metodo, periodo, alvo } = entrada.discretizacao;
    formula(
      dados,
      `\\text{Discretizar } ${ALVOS[alvo]} \\text{ por ${METODOS[metodo].nome}}, \\quad T = ${numeroLatex(periodo)}\\,\\text{s}`,
    );
  }
  bloco.appendChild(dados);
  destino.appendChild(bloco);
}

export function renderizarResultado(destino, projeto, opcoes = {}) {
  const { questao = null, barra = true, aberto = false } = opcoes;
  if (barra) {
    montarBarraDeResultado(destino, tituloDoArquivo(projeto, questao));
  }
  montarCabecalho(destino, projeto, questao);

  for (const passo of passos) {
    if (passo.requerViabilidade && !projeto.viavel) {
      break;
    }
    if (passo.aplicavel && !passo.aplicavel(projeto)) {
      continue;
    }
    const titulo = passo.tituloPara ? passo.tituloPara(projeto) : passo.titulo;
    const corpo = secao(destino, titulo, aberto || passo.abertoPorPadrao === true);
    passo.renderizar(corpo, projeto);
  }
  if (projeto.viavel) {
    graficoCompleto.renderizar(destino, projeto);
  }
}
