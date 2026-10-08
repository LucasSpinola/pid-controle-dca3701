import * as P from '../nucleo/polinomio.js';

const FOLGA_RELATIVA = 1e-10;

function quaseZero(valor, escala) {
  return Math.abs(valor) < FOLGA_RELATIVA * Math.max(escala, 1e-300);
}

function retirarIntegradoresComuns(numerador, denominador) {
  const num = P.normalizar(numerador).slice();
  const den = P.normalizar(denominador).slice();
  const escalaNum = P.maiorCoeficiente(num);
  const escalaDen = P.maiorCoeficiente(den);
  while (
    num.length > 1 && den.length > 1
    && quaseZero(num[num.length - 1], escalaNum) && quaseZero(den[den.length - 1], escalaDen)
  ) {
    num.pop();
    den.pop();
  }
  return { num, den };
}

function constante(num, den, ordem, tipo) {
  if (ordem < tipo) {
    return Infinity;
  }
  if (ordem > tipo) {
    return 0;
  }
  return num[num.length - 1] / den[den.length - 1 - tipo];
}

export function constantesDeErro(numerador, denominador) {
  const { num, den } = retirarIntegradoresComuns(numerador, denominador);
  const escalaDen = P.maiorCoeficiente(den);
  let tipo = 0;
  while (tipo < den.length - 1 && quaseZero(den[den.length - 1 - tipo], escalaDen)) {
    tipo += 1;
  }

  const kp = constante(num, den, 0, tipo);
  const kv = constante(num, den, 1, tipo);
  const ka = constante(num, den, 2, tipo);
  return {
    tipo,
    kp,
    kv,
    ka,
    erroDegrau: 1 / (1 + kp),
    erroRampa: 1 / kv,
    erroParabola: 1 / ka,
  };
}
