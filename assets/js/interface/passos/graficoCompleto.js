import { elemento, paragrafo, quadroDeGrafico, secao } from '../componentes.js';
import { montarBotaoDeDownload } from '../ferramentas.js';
import { formatarG } from '../../formatacao/numero.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  desenharRamos,
  desenharPolosZeros,
  desenharControlador,
  desenharPolosDesejados,
  desenharPolosDeMalhaFechada,
  desenharRetasDeAmortecimento,
} from '../../grafico/camadas.js';
import { pontosNotaveis } from '../../projeto/pontosNotaveis.js';

export const titulo = '**LGR do sistema compensado** (verificação)';

export function renderizar(pai, projeto, aberto = false) {
  const { varredura, malhaAberta, zero, desempenho, malhaFechada, modulo } = projeto;
  const controlador = projeto.controladorFinal || projeto.controlador;
  const corpo = secao(pai, titulo, aberto);
  const acoes = elemento('div', 'grafico-final-cabecalho');
  corpo.appendChild(acoes);

  const plano = criarPlano(
    pontosNotaveis({ ...projeto, controlador }, { malhaFechada: true }),
    `Lugar geométrico das raízes com o ${controlador.nome}`,
  );
  desenharRetasDeAmortecimento(plano, desempenho.zeta);
  desenharRamos(plano, varredura, { espessura: 2.6, opacidade: 0.95, legenda: 'Ramos do LGR' });
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  desenharControlador(plano, controlador, zero);
  desenharPolosDesejados(plano, desempenho.polo, { rotular: false });
  desenharPolosDeMalhaFechada(plano, malhaFechada.polos.map((item) => item.ponto));

  const svg = plano.elemento();
  quadroDeGrafico(corpo, svg);
  montarBotaoDeDownload(acoes, svg, `lgr-compensado-${controlador.id}.svg`);

  paragrafo(
    corpo,
    `Varredura de $${controlador.simboloGanho}$ de $0$ até $${formatarG(varredura.ganhoMaximo, 4)}$. Os quadrados marcam os polos `
    + `de malha fechada em $${controlador.simboloGanho} = ${formatarG(modulo.kc, 6)}$, e o par desejado cai sobre os ramos.`,
  );
}
