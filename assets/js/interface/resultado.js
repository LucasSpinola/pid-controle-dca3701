import { elemento, formula, paragrafo, secao } from './componentes.js';
import { montarBarraDeResultado } from './ferramentas.js';
import { passos } from './passos/indice.js';
import * as graficoCompleto from './passos/graficoCompleto.js';
import { passosDoAtraso } from './passos/atraso.js';
import { obterControlador } from '../projeto/controladores.js';
import { razaoLatex } from '../formatacao/latex.js';
import { numeroLatex } from '../formatacao/numero.js';
import { controladorLatex } from '../formatacao/controlador.js';
import { METODOS, ALVOS } from '../projeto/discretizacao.js';

function especificacaoLatex(especificacao) {
  if (especificacao.modo === 'polos') {
    return `s_d = ${numeroLatex(especificacao.real)} \\pm ${numeroLatex(especificacao.imaginario)}\\,j`;
  }
  const partes = [];
  if (especificacao.sobressinal !== undefined) {
    partes.push(`M_P \\le ${numeroLatex(especificacao.sobressinal)}\\%`);
  }
  if (especificacao.zeta !== undefined) {
    partes.push(`\\zeta = ${numeroLatex(especificacao.zeta)}`);
  }
  if (especificacao.omegaN !== undefined) {
    partes.push(`\\omega_n = ${numeroLatex(especificacao.omegaN)}\\,\\text{rad/s}`);
  }
  if (especificacao.acomodacao !== undefined) {
    partes.push(`t_s(${especificacao.criterio}\\%) < ${numeroLatex(especificacao.acomodacao)}\\,\\text{s}`);
  }
  if (especificacao.tempoDePico !== undefined) {
    partes.push(`t_p = ${numeroLatex(especificacao.tempoDePico)}\\,\\text{s}`);
  }
  return partes.join(', \\qquad ');
}

export function tituloDoArquivo(projeto, questao) {
  if (questao) {
    return `${questao.exercicio} - ${questao.nome}`;
  }
  const nomes = { polo: 'a-(s+b)', 'compensador-zero': 'compensador', 'compensador-polo': 'compensador' };
  const controlador = projeto.controlador || obterControlador(projeto.entrada.controlador);
  return `Projeto ${nomes[controlador.id] || controlador.nome}`;
}

function montarCabecalho(destino, projeto, questao) {
  const { entrada } = projeto;
  const controlador = projeto.controlador || obterControlador(entrada.controlador, entrada.fixo);
  const bloco = elemento('section', 'enunciado');
  bloco.appendChild(elemento('p', 'enunciado-etiqueta', questao ? `${questao.exercicio} · ${questao.nome}` : 'Dados do projeto'));

  for (const texto of questao?.enunciado || []) {
    paragrafo(bloco, texto);
  }

  const dados = elemento('div', 'enunciado-dados');
  formula(dados, `G(s) = ${razaoLatex(entrada.nG, entrada.dG)}, \\qquad H(s) = ${razaoLatex(entrada.nH, entrada.dH)}`);
  formula(dados, controladorLatex(controlador));
  if (entrada.especificacao) {
    formula(dados, especificacaoLatex(entrada.especificacao));
  }
  if (entrada.atraso) {
    const partes = [
      `K^{\\text{comp}} = ${numeroLatex(entrada.atraso.constante)}`,
      `z_{\\text{atraso}} = ${numeroLatex(entrada.atraso.zero)}`,
    ];
    if (entrada.atraso.zeta) {
      partes.push(`\\zeta = ${numeroLatex(entrada.atraso.zeta)}`);
    }
    formula(dados, partes.join(', \\qquad '));
  }
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

  if (projeto.tipo === 'atraso') {
    for (const passo of passosDoAtraso) {
      passo.renderizar(secao(destino, passo.titulo, aberto || passo.abertoPorPadrao === true), projeto);
    }
    return;
  }

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
