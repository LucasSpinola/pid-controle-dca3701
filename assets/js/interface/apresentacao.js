import { interpretarPolinomio } from '../nucleo/entrada.js';
import { razaoLatex } from '../formatacao/latex.js';
import { controladorLatex } from '../formatacao/controlador.js';
import { esbocarProjeto } from '../projeto/projeto.js';
import { obterControlador } from '../projeto/controladores.js';
import { pontosNotaveis } from '../projeto/pontosNotaveis.js';
import { criarPlano, LIMITES_COMPACTOS } from '../grafico/fabrica.js';
import {
  desenharPolosZeros,
  desenharPolosDesejados,
  desenharRetasDeAmortecimento,
  desenharControlador,
  desenharFixosDoControlador,
} from '../grafico/camadas.js';
import { elemento, escrever, formula, limparNo } from './componentes.js';
import {
  CAMPOS,
  VALORES_PADRAO,
  campo,
  atualizarModo,
  lerCoeficientes,
  lerEspecificacao,
  lerFixo,
} from './formulario.js';
import { EXERCICIOS } from './exercicios.js';
import { passos } from './passos/indice.js';
import { imprimirLista } from './relatorio.js';

const ESPERA_DA_MINIATURA = 320;
let agendamentoDaMiniatura = null;
let questaoAtual = null;

const PREVIAS = [
  { numerador: 'nG', denominador: 'dG', destino: 'previa-g', nome: 'G(s)' },
  { numerador: 'nH', denominador: 'dH', destino: 'previa-h', nome: 'H(s)' },
];

function atualizarPrevia(configuracao) {
  const destino = document.getElementById(configuracao.destino);
  const numerador = interpretarPolinomio(campo(configuracao.numerador).value);
  const denominador = interpretarPolinomio(campo(configuracao.denominador).value);

  limparNo(destino);
  destino.classList.remove('previa-invalida');

  if (numerador === null || denominador === null) {
    destino.classList.add('previa-invalida');
    escrever(destino, 'Expressão inválida');
    return;
  }
  formula(destino, `${configuracao.nome} = ${razaoLatex(numerador, denominador)}`);
}

function atualizarPreviaDoControlador() {
  const destino = limparNo(document.getElementById('previa-controlador'));
  formula(destino, controladorLatex(obterControlador(campo('controlador').value, lerFixo())));
}

function desenharMiniatura() {
  const destino = document.getElementById('miniatura');
  const coeficientes = lerCoeficientes();
  limparNo(destino);

  if (coeficientes.some((item) => item === null)) {
    destino.appendChild(elemento('p', 'capa-figura-vazia', 'Aguardando coeficientes válidos'));
    return;
  }

  try {
    const leitura = lerEspecificacao();
    const esboco = esbocarProjeto(
      ...coeficientes,
      leitura.especificacao || null,
      campo('controlador').value,
      lerFixo(),
    );
    const plano = criarPlano(pontosNotaveis(esboco), '', { limites: LIMITES_COMPACTOS, semLegenda: true });
    if (esboco.desempenho) {
      desenharRetasDeAmortecimento(plano, esboco.desempenho.zeta);
    }
    desenharPolosZeros(plano, esboco.malhaAberta.polos, esboco.malhaAberta.zeros);
    if (esboco.zero) {
      desenharControlador(plano, esboco.controlador, esboco.zero, { rotular: false });
    } else {
      desenharFixosDoControlador(plano, esboco.controlador);
    }
    if (esboco.desempenho) {
      desenharPolosDesejados(plano, esboco.desempenho.polo, { rotular: false });
    }
    destino.appendChild(plano.elemento());
  } catch (falha) {
    destino.appendChild(elemento('p', 'capa-figura-vazia', 'Prévia indisponível'));
  }
}

function agendarMiniatura() {
  window.clearTimeout(agendamentoDaMiniatura);
  agendamentoDaMiniatura = window.setTimeout(desenharMiniatura, ESPERA_DA_MINIATURA);
}

function limparSelecaoDeExemplo() {
  questaoAtual = null;
  document.querySelectorAll('.pilula-ativa').forEach((item) => {
    item.classList.remove('pilula-ativa');
  });
}

export function questaoSelecionada() {
  return questaoAtual;
}

function atualizarTudo() {
  PREVIAS.forEach(atualizarPrevia);
  atualizarPreviaDoControlador();
  agendarMiniatura();
}

function conectarCampos() {
  for (const nome of Object.keys(CAMPOS)) {
    const evento = campo(nome).tagName === 'SELECT' ? 'change' : 'input';
    campo(nome).addEventListener(evento, () => {
      limparSelecaoDeExemplo();
      atualizarTudo();
    });
  }
}

function aplicarQuestao(questao) {
  for (const [nome, valor] of Object.entries({ ...VALORES_PADRAO, ...questao })) {
    if (nome in CAMPOS) {
      campo(nome).value = valor;
    }
  }
  atualizarModo();
  atualizarTudo();
}

function montarExemplos(destacarPrimeira) {
  const lista = document.getElementById('exemplos');
  EXERCICIOS.forEach((exercicio, posicao) => {
    const grupo = elemento('div', 'exemplos-grupo');
    grupo.appendChild(elemento('span', 'exemplos-rotulo', exercicio.nome));
    if (destacarPrimeira && posicao === 0) {
      questaoAtual = { ...exercicio.questoes[0], exercicio: exercicio.nome };
    }
    exercicio.questoes.forEach((questao, indice) => {
      const botao = elemento('button', 'pilula', questao.nome);
      botao.type = 'button';
      if (destacarPrimeira && posicao === 0 && indice === 0) {
        botao.classList.add('pilula-ativa');
      }
      botao.addEventListener('click', () => {
        limparSelecaoDeExemplo();
        botao.classList.add('pilula-ativa');
        aplicarQuestao(questao);
        questaoAtual = { ...questao, exercicio: exercicio.nome };
      });
      grupo.appendChild(botao);
    });

    const pdf = elemento('button', 'pilula pilula-pdf', 'PDF da lista');
    pdf.type = 'button';
    pdf.title = `Resolve todas as questões do ${exercicio.nome} e abre a impressão para salvar em PDF.`;
    pdf.addEventListener('click', () => imprimirLista(exercicio));
    grupo.appendChild(pdf);
    lista.appendChild(grupo);
  });
}

function montarRoteiro() {
  const lista = document.getElementById('roteiro-lista');
  passos.forEach((passo, indice) => {
    const texto = passo.titulo.replace(/\*\*/g, '');
    const item = elemento('li', 'roteiro-item');
    item.appendChild(elemento('span', 'roteiro-numero', String(indice + 1)));
    escrever(item.appendChild(elemento('span', 'roteiro-texto')), texto.split(': ')[1] || texto);
    lista.appendChild(item);
  });
}

function formatarTextosEstaticos() {
  for (const no of document.querySelectorAll('[data-formatar]')) {
    const conteudo = no.textContent.trim().replace(/\s+/g, ' ');
    escrever(limparNo(no), conteudo);
  }
}

export function montarApresentacao(destacarPrimeira = true) {
  formatarTextosEstaticos();
  montarExemplos(destacarPrimeira);
  montarRoteiro();
  conectarCampos();
  PREVIAS.forEach(atualizarPrevia);
  atualizarPreviaDoControlador();
  desenharMiniatura();
}

export function esconderRoteiro() {
  const roteiro = document.getElementById('roteiro');
  if (roteiro) {
    roteiro.hidden = true;
  }
}
