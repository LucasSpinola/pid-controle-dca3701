import { formula, paragrafo, separador, aviso, quadroDeGrafico } from '../componentes.js';
import { razaoLatex, complexoLatex } from '../../formatacao/latex.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';
import { criarPlano, criarGraficoTemporal } from '../../grafico/fabrica.js';
import {
  CORES,
  desenharPolosZeros,
  desenharPolosDeMalhaFechada,
  desenharRetasDeAmortecimento,
  desenharResposta,
  desenharNivel,
} from '../../grafico/camadas.js';
import { renderizarParte } from './passo06b.js';

function tempoLatex(valor) {
  if (valor === null) {
    return '\\text{sem pico}';
  }
  if (!Number.isFinite(valor)) {
    return '\\text{não acomoda}';
  }
  return `${fixoLatex(valor, 3)}\\,\\text{s}`;
}

const passo1 = {
  titulo: '**Passo 1:** Ganho de malha aberta',
  abertoPorPadrao: true,
  renderizar(destino, projeto) {
    const { entrada, ajuste, ganho, dominante, malhaAberta } = projeto;
    formula(destino, `G(s)H(s) = ${razaoLatex(malhaAberta.numerador, malhaAberta.denominador)}`);
    if (ajuste) {
      const zeta = entrada.atraso.zeta;
      paragrafo(
        destino,
        `Procura-se, sobre a reta de $\\zeta = ${numeroLatex(zeta)}$, o ponto $s_1$ do LGR, onde a condição de ângulo vale:`,
      );
      formula(destino, `\\angle G(s_1)H(s_1) = 180^\\circ \\;\\Rightarrow\\; s_1 = ${complexoLatex(ajuste.ponto)}, \\qquad \\omega_n = ${fixoLatex(ajuste.omegaN, 4)}`);
      paragrafo(destino, 'O ganho sai da condição de módulo:');
      formula(destino, `K = \\frac{1}{|G(s_1)H(s_1)|} = ${numeroLatex(ganho)}`);
      return;
    }
    paragrafo(destino, 'O ganho de $G(s)$ fica como está ($K = 1$). Polo dominante de malha fechada do sistema original:');
    formula(destino, `s_1 = ${complexoLatex(dominante)}`);
  },
};

const passo2 = {
  titulo: '**Passo 2:** Constante de erro e parte em atraso',
  abertoPorPadrao: true,
  renderizar(destino, projeto) {
    paragrafo(
      destino,
      'O controlador em atraso aumenta a constante de erro sem mexer muito no transitório: '
      + 'zero e polo ficam próximos entre si e da origem.',
    );
    renderizarParte(destino, projeto.parte, 's_1', 'KGH');
  },
};

const passo3 = {
  titulo: '**Passo 3:** Controlador projetado',
  abertoPorPadrao: true,
  renderizar(destino, projeto) {
    const { ganho, parte, compensada, constanteFinal } = projeto;
    formula(
      destino,
      `G_c(s) = ${numeroLatex(ganho)}\\,\\frac{s + ${numeroLatex(parte.zero)}}{s + ${numeroLatex(parte.polo)}} = ${razaoLatex(compensada.numeradorControlador, compensada.denominadorControlador)}`,
    );
    formula(destino, `${parte.simbolo}^{\\text{comp}} = ${numeroLatex(constanteFinal)}`);
    aviso(
      destino,
      'sucesso',
      `**Atraso:** $z = ${numeroLatex(parte.zero)}$, $p = ${numeroLatex(parte.polo)}$, $\\beta = ${numeroLatex(parte.beta)}$, $K = ${numeroLatex(ganho)}$`,
    );
  },
};

function listarPolos(destino, rotulo, polos) {
  paragrafo(destino, rotulo);
  formula(destino, polos.map((p, i) => `s_{${i + 1}} = ${complexoLatex(p)}`).join(', \\quad '));
}

const passo4 = {
  titulo: '**Passo 4:** Malha fechada com e sem o atraso (verificação)',
  renderizar(destino, projeto) {
    const { original, compensada, dominante, novoDominante, entrada } = projeto;
    listarPolos(destino, '**Sem o atraso:**', original.polos);
    listarPolos(destino, '**Com o atraso:**', compensada.polos);
    formula(
      destino,
      `s_1 = ${complexoLatex(dominante)} \\;\\longrightarrow\\; ${complexoLatex(novoDominante)}`,
    );
    paragrafo(
      destino,
      'O par dominante quase não se move. O polo e o zero novos perto da origem quase se cancelam, '
      + 'mas deixam uma cauda lenta na resposta.',
    );

    separador(destino);
    const plano = criarPlano([...original.polos, ...compensada.polos, ...compensada.zeros], 'Polos de malha fechada');
    if (entrada.atraso.zeta) {
      desenharRetasDeAmortecimento(plano, entrada.atraso.zeta);
    }
    desenharPolosZeros(plano, original.polos, [], { legendaPolos: 'Sem o atraso' });
    desenharPolosDeMalhaFechada(plano, compensada.polos);
    quadroDeGrafico(destino, plano.elemento());
  },
};

const passo5 = {
  titulo: '**Passo 5:** Resposta ao degrau (verificação)',
  renderizar(destino, projeto) {
    const { original, compensada } = projeto;
    if (!original.resposta || !compensada.resposta) {
      aviso(destino, 'erro', 'Uma das malhas fechadas é instável, então não há resposta ao degrau para comparar.');
      return;
    }
    const linhas = [
      ['M_P', `${fixoLatex(original.resposta.metricas.sobressinal, 2)}\\%`, `${fixoLatex(compensada.resposta.metricas.sobressinal, 2)}\\%`],
      ['t_p', tempoLatex(original.resposta.metricas.tempoDePico), tempoLatex(compensada.resposta.metricas.tempoDePico)],
      ['t_s(2\\%)', tempoLatex(original.resposta.metricas.acomodacao2), tempoLatex(compensada.resposta.metricas.acomodacao2)],
      ['y(\\infty)', fixoLatex(original.resposta.metricas.valorFinal, 4), fixoLatex(compensada.resposta.metricas.valorFinal, 4)],
    ];
    formula(
      destino,
      [
        '\\begin{array}{l|c|c}',
        '\\text{Grandeza} & \\text{Sem atraso} & \\text{Com atraso} \\\\ \\hline',
        linhas.map((linha) => linha.join(' & ')).join(' \\\\ '),
        '\\end{array}',
      ].join(' '),
    );

    separador(destino);
    const todas = [...original.resposta.simulacao.saidas, ...compensada.resposta.simulacao.saidas];
    const duracao = Math.max(original.resposta.simulacao.duracao, compensada.resposta.simulacao.duracao);
    const grafico = criarGraficoTemporal(duracao, Math.min(...todas), Math.max(...todas), 'Resposta ao degrau unitário');
    desenharNivel(grafico, compensada.resposta.metricas.valorFinal, CORES.valorFinal, 'Valor final');
    desenharResposta(grafico, original.resposta.simulacao, { cor: CORES.amortecimento, legenda: 'Sem o atraso', tracejado: '6 4', espessura: 2 });
    desenharResposta(grafico, compensada.resposta.simulacao, { legenda: 'Com o atraso' });
    quadroDeGrafico(destino, grafico.elemento());
  },
};

export const passosDoAtraso = [passo1, passo2, passo3, passo4, passo5];
