import { elemento, paragrafo, quadroDeGrafico } from '../componentes.js';
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

export function renderizar(pai, projeto) {
  const { varredura, malhaAberta, controlador, zero, desempenho, malhaFechada, modulo } = projeto;
  const bloco = elemento('section', 'grafico-final');
  const cabecalho = elemento('div', 'grafico-final-cabecalho');
  cabecalho.appendChild(elemento('h2', 'titulo-secao', 'LGR do sistema compensado'));
  bloco.appendChild(cabecalho);

  const plano = criarPlano(
    pontosNotaveis(projeto, { malhaFechada: true }),
    `Lugar geométrico das raízes com o ${controlador.nome}`,
  );
  desenharRetasDeAmortecimento(plano, desempenho.zeta);
  desenharRamos(plano, varredura, { espessura: 2.6, opacidade: 0.95, legenda: 'Ramos do LGR' });
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  desenharControlador(plano, controlador, zero);
  desenharPolosDesejados(plano, desempenho.polo, { rotular: false });
  desenharPolosDeMalhaFechada(plano, malhaFechada.polos.map((item) => item.ponto));

  const svg = plano.elemento();
  quadroDeGrafico(bloco, svg);
  montarBotaoDeDownload(cabecalho, svg, `lgr-compensado-${controlador.id}.svg`);

  paragrafo(
    bloco,
    `Varredura de $${controlador.simboloGanho}$ de $0$ até $${formatarG(varredura.ganhoMaximo, 4)}$. Os quadrados marcam os polos `
    + `de malha fechada em $${controlador.simboloGanho} = ${formatarG(modulo.kc, 6)}$, e o par desejado cai sobre os ramos.`,
  );

  pai.appendChild(bloco);
}
