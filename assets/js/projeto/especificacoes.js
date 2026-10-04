export const CONSTANTES_DE_ACOMODACAO = { 2: 4, 5: 3 };

export function amortecimentoDoSobressinal(sobressinal) {
  const logaritmo = Math.log(sobressinal / 100);
  return -logaritmo / Math.sqrt(Math.PI ** 2 + logaritmo ** 2);
}

export function sobressinalDoAmortecimento(zeta) {
  return 100 * Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta ** 2));
}

function polosDesejados(zeta, omegaN) {
  const sigma = zeta * omegaN;
  const omegaD = omegaN * Math.sqrt(1 - zeta ** 2);
  return {
    zeta,
    omegaN,
    sigma,
    omegaD,
    polo: { re: -sigma, im: omegaD },
    referencia: {
      sobressinal: sobressinalDoAmortecimento(zeta),
      acomodacao2: CONSTANTES_DE_ACOMODACAO[2] / sigma,
      acomodacao5: CONSTANTES_DE_ACOMODACAO[5] / sigma,
      tempoDePico: Math.PI / omegaD,
    },
  };
}

function porDesempenho(especificacao) {
  const { sobressinal, acomodacao, criterio } = especificacao;
  const zeta = amortecimentoDoSobressinal(sobressinal);
  const constante = CONSTANTES_DE_ACOMODACAO[criterio];
  const sigma = constante / acomodacao;
  return { ...especificacao, constante, ...polosDesejados(zeta, sigma / zeta) };
}

function porPolos(especificacao) {
  const omegaN = Math.hypot(especificacao.real, especificacao.imaginario);
  return { ...especificacao, ...polosDesejados(-especificacao.real / omegaN, omegaN) };
}

export function interpretarEspecificacao(especificacao) {
  if (especificacao.modo === 'desempenho') {
    return porDesempenho(especificacao);
  }
  if (especificacao.modo === 'polos') {
    return porPolos(especificacao);
  }
  return { ...especificacao, ...polosDesejados(especificacao.zeta, especificacao.omegaN) };
}
