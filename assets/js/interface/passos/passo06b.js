import { formula, paragrafo, separador, aviso } from '../componentes.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 6b:** Parte em atraso de fase';
export const requerViabilidade = true;

const LIMITE_DE_ANGULO = -5;

export function aplicavel(projeto) {
  return Boolean(projeto.atraso);
}

const LIMITES = ['K_p = \\lim_{s \\to 0} G_cGH', 'K_v = \\lim_{s \\to 0} s\\,G_cGH', 'K_a = \\lim_{s \\to 0} s^2 G_cGH'];

export function renderizarParte(destino, parte, nomeDoPonto = 's_d', malha = 'G_cGH') {
  paragrafo(destino, `**Constante de erro atual** (sistema tipo ${parte.tipo}):`);
  formula(destino, `${LIMITES[parte.tipo].replace('G_cGH', malha)} = ${numeroLatex(parte.atual)}`);

  paragrafo(destino, '**Aumento necessário:**');
  formula(
    destino,
    `\\beta = \\frac{${parte.simbolo}^{\\text{comp}}}{${parte.simbolo}} = \\frac{${numeroLatex(parte.desejada)}}{${numeroLatex(parte.atual)}} = ${numeroLatex(parte.beta)}`,
  );
  if (!parte.necessario) {
    aviso(
      destino,
      'informacao',
      `A constante atual já atende ao pedido ($\\beta \\le 1$), então a parte em atraso não é necessária.`,
    );
  }

  separador(destino);
  paragrafo(destino, 'Zero perto da origem e polo $\\beta$ vezes mais perto:');
  formula(
    destino,
    `z = ${numeroLatex(parte.zero)} \\;\\Rightarrow\\; p = \\frac{z}{\\beta} = \\frac{${numeroLatex(parte.zero)}}{${numeroLatex(parte.beta)}} = ${numeroLatex(parte.polo)}`,
  );
  formula(destino, `G_{\\text{atraso}}(s) = \\frac{s + ${numeroLatex(parte.zero)}}{s + ${numeroLatex(parte.polo)}}`);

  separador(destino);
  paragrafo(destino, `**Verificação em $${nomeDoPonto}$:** a parte em atraso deve mexer pouco no LGR.`);
  formula(
    destino,
    `\\angle\\frac{${nomeDoPonto} + ${numeroLatex(parte.zero)}}{${nomeDoPonto} + ${numeroLatex(parte.polo)}} = ${fixoLatex(parte.angulo, 2)}^\\circ, \\qquad \\left|\\frac{${nomeDoPonto} + ${numeroLatex(parte.zero)}}{${nomeDoPonto} + ${numeroLatex(parte.polo)}}\\right| = ${fixoLatex(parte.modulo, 4)}`,
  );
  if (parte.angulo < LIMITE_DE_ANGULO) {
    aviso(
      destino,
      'atencao',
      `A contribuição passa de $${LIMITE_DE_ANGULO}^\\circ$. Aproxime o zero da origem (aumente $T$) para o atraso mexer menos no transitório.`,
    );
  } else {
    aviso(destino, 'sucesso', `Contribuição entre $${LIMITE_DE_ANGULO}^\\circ$ e $0^\\circ$ e módulo perto de $1$: o transitório quase não muda.`);
  }
}

export function renderizar(destino, projeto) {
  paragrafo(
    destino,
    'A parte em avanço já leva $s_d$ para o LGR. A parte em atraso aumenta a constante de erro sem mudar muito o transitório.',
  );
  renderizarParte(destino, projeto.atraso);
}
