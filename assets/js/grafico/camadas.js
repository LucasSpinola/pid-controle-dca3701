import { extrairRamo } from '../projeto/lugarRaizes.js';
import { fixo } from '../formatacao/numero.js';

export const CORES = {
  polo: '#d0342c',
  zero: '#1f9d55',
  ramo: '#2b6cd9',
  ramoFundo: '#98a2b3',
  desejado: '#a435c9',
  desejadoBorda: '#5b1a72',
  controlador: '#e08b1a',
  malhaFechada: '#12b0c8',
  malhaFechadaBorda: '#123c8c',
  amortecimento: '#7b8794',
  resposta: '#2b6cd9',
  valorFinal: '#46535f',
  faixa: '#1f9d55',
  limite: '#d0342c',
};

function fatiar(pontos, janela) {
  const folgaX = (janela.xMax - janela.xMin) * 3;
  const folgaY = (janela.yMax - janela.yMin) * 3;
  const dentro = (ponto) => ponto.re >= janela.xMin - folgaX
    && ponto.re <= janela.xMax + folgaX
    && ponto.im >= janela.yMin - folgaY
    && ponto.im <= janela.yMax + folgaY;

  const trechos = [];
  let atual = [];
  for (let i = 0; i < pontos.length; i += 1) {
    if (dentro(pontos[i])) {
      if (atual.length === 0 && i > 0) {
        atual.push(pontos[i - 1]);
      }
      atual.push(pontos[i]);
    } else if (atual.length > 0) {
      atual.push(pontos[i]);
      trechos.push(atual);
      atual = [];
    }
  }
  if (atual.length > 0) {
    trechos.push(atual);
  }
  return trechos;
}

export function desenharRamos(plano, varredura, opcoes = {}) {
  const cor = opcoes.cor || CORES.ramo;
  const espessura = opcoes.espessura || 2.4;
  const opacidade = opcoes.opacidade ?? 0.9;

  for (let j = 0; j < varredura.ramos; j += 1) {
    for (const trecho of fatiar(extrairRamo(varredura, j), plano.janela)) {
      plano.caminho(trecho, {
        stroke: cor,
        'stroke-width': espessura,
        'stroke-opacity': opacidade,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      });
    }
  }
  if (opcoes.legenda) {
    plano.registrarLegenda('linha', cor, opcoes.legenda);
  }
}

export function desenharPolosZeros(plano, polos, zeros, opcoes = {}) {
  polos.forEach((p, indice) => {
    plano.cruz(p, { stroke: CORES.polo, 'stroke-width': 2.4 });
    if (opcoes.rotular) {
      plano.rotulo(p, `p${indice + 1}`, { fill: CORES.polo });
    }
  });
  zeros.forEach((z, indice) => {
    plano.circulo(z, { stroke: CORES.zero, 'stroke-width': 2.2, fill: 'none' });
    if (opcoes.rotular) {
      plano.rotulo(z, `z${indice + 1}`, { fill: CORES.zero });
    }
  });

  if (polos.length > 0) {
    plano.registrarLegenda('x', CORES.polo, opcoes.legendaPolos || 'Polos de G(s)H(s)');
  }
  if (zeros.length > 0) {
    plano.registrarLegenda('circulo', CORES.zero, opcoes.legendaZeros || 'Zeros de G(s)H(s)');
  }
}

export function desenharRetasDeAmortecimento(plano, zeta) {
  const angulo = Math.acos(zeta);
  const comprimento = 2 * Math.hypot(
    plano.janela.xMax - plano.janela.xMin,
    plano.janela.yMax - plano.janela.yMin,
  );
  for (const sinal of [1, -1]) {
    plano.linha({ re: 0, im: 0 }, {
      re: -comprimento * Math.cos(angulo),
      im: sinal * comprimento * Math.sin(angulo),
    }, {
      stroke: CORES.amortecimento,
      'stroke-width': 1.4,
      'stroke-dasharray': '6 5',
    });
  }
  plano.registrarLegenda('tracejada', CORES.amortecimento, `Reta de ζ = ${fixo(zeta, 4)}`);
}

export function desenharPolosDesejados(plano, polo, opcoes = {}) {
  for (const ponto of [polo, { re: polo.re, im: -polo.im }]) {
    plano.estrela(ponto, { fill: CORES.desejado, stroke: CORES.desejadoBorda, 'stroke-width': 1.2 });
  }
  if (opcoes.rotular !== false) {
    plano.rotulo(polo, `sd = ${fixo(polo.re, 2)} ± j${fixo(polo.im, 2)}`, { fill: CORES.desejadoBorda });
  }
  plano.registrarLegenda('linha', CORES.desejado, 'Polos desejados');
}

export function desenharPoloDoControlador(plano) {
  plano.cruz({ re: 0, im: 0 }, { stroke: CORES.controlador, 'stroke-width': 2.6 }, 7);
  plano.registrarLegenda('x', CORES.controlador, 'Polo do controlador');
}

export function desenharFixosDoControlador(plano, controlador) {
  const polos = [
    ...new Array(controlador.polosNaOrigem).fill(null).map(() => ({ re: 0, im: 0 })),
    ...(controlador.polosFixos || []).map((valor) => ({ re: -valor, im: 0 })),
  ];
  const zeros = (controlador.zerosFixos || []).map((valor) => ({ re: -valor, im: 0 }));
  for (const ponto of polos) {
    plano.cruz(ponto, { stroke: CORES.controlador, 'stroke-width': 2.6 }, 7);
  }
  for (const ponto of zeros) {
    plano.circulo(ponto, { stroke: CORES.controlador, 'stroke-width': 2.6, fill: 'none' }, 7);
  }
  if (polos.length > 0) {
    plano.registrarLegenda('x', CORES.controlador, controlador.polosNaOrigem > 0 ? 'Polo do controlador' : 'Polo dado do controlador');
  }
  if (zeros.length > 0) {
    plano.registrarLegenda('circulo', CORES.controlador, 'Zero dado do controlador');
  }
}

export function desenharControlador(plano, controlador, zero, opcoes = {}) {
  desenharFixosDoControlador(plano, controlador);
  if (controlador.polosLivres > 0) {
    plano.cruz(zero.ponto, { stroke: CORES.controlador, 'stroke-width': 2.6 }, 7);
    if (opcoes.rotular !== false) {
      plano.rotulo(zero.ponto, `-${controlador.simboloLivre} = ${fixo(-zero.valor, 3)}`, { fill: CORES.controlador });
    }
    plano.registrarLegenda('x', CORES.controlador, 'Polo do controlador');
    return;
  }

  plano.circulo(zero.ponto, { stroke: CORES.controlador, 'stroke-width': 2.6, fill: 'none' }, 7);
  if (controlador.zeros > 1) {
    plano.circulo(zero.ponto, { stroke: CORES.controlador, 'stroke-width': 1.8, fill: 'none' }, 3.5);
  }
  if (opcoes.rotular !== false) {
    plano.rotulo(zero.ponto, `-z = ${fixo(-zero.valor, 3)}`, { fill: CORES.controlador });
  }
  plano.registrarLegenda(
    'circulo',
    CORES.controlador,
    controlador.zeros > 1 ? 'Zero duplo do controlador' : 'Zero do controlador',
  );
}

export function desenharVetores(plano, origens, ponto, cor) {
  for (const origem of origens) {
    plano.linha(origem, ponto, {
      stroke: cor, 'stroke-width': 1.2, 'stroke-dasharray': '3 4', 'stroke-opacity': 0.7,
    });
  }
}

export function desenharPolosDeMalhaFechada(plano, polos) {
  for (const ponto of polos) {
    plano.quadrado(ponto, {
      fill: CORES.malhaFechada,
      stroke: CORES.malhaFechadaBorda,
      'stroke-width': 1.6,
    }, 4.5);
  }
  plano.registrarLegenda('linha', CORES.malhaFechada, 'Polos de malha fechada');
}

export function desenharResposta(grafico, simulacao, opcoes = {}) {
  const cor = opcoes.cor || CORES.resposta;
  grafico.curva(simulacao.tempos, simulacao.saidas, {
    stroke: cor,
    'stroke-width': opcoes.espessura || 2.4,
    'stroke-linejoin': 'round',
    ...(opcoes.tracejado ? { 'stroke-dasharray': opcoes.tracejado } : {}),
  });
  grafico.registrarLegenda('linha', cor, opcoes.legenda || 'y(t)');
}

export function desenharNivel(grafico, valor, cor, rotulo, tracejado = '6 5') {
  grafico.reta(grafico.janela.xMin, valor, grafico.janela.xMax, valor, {
    stroke: cor,
    'stroke-width': 1.4,
    'stroke-dasharray': tracejado,
  });
  grafico.registrarLegenda('tracejada', cor, rotulo);
}

export function desenharFaixa(grafico, valorFinal, faixa) {
  const desvio = Math.abs(valorFinal) * faixa;
  for (const nivel of [valorFinal - desvio, valorFinal + desvio]) {
    grafico.reta(grafico.janela.xMin, nivel, grafico.janela.xMax, nivel, {
      stroke: CORES.faixa,
      'stroke-width': 1.2,
      'stroke-dasharray': '2 4',
    });
  }
  grafico.registrarLegenda('tracejada', CORES.faixa, `Faixa de ±${fixo(faixa * 100, 0)}%`);
}

export function desenharInstante(grafico, tempo, cor, rotulo) {
  if (!Number.isFinite(tempo) || tempo > grafico.janela.xMax) {
    return;
  }
  grafico.reta(tempo, grafico.janela.yMin, tempo, grafico.janela.yMax, {
    stroke: cor,
    'stroke-width': 1.4,
    'stroke-dasharray': '4 4',
  });
  grafico.registrarLegenda('tracejada', cor, rotulo);
}
