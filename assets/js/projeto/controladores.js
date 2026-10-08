import * as P from '../nucleo/polinomio.js';

const CONTROLADORES = [
  {
    id: 'pd',
    nome: 'PD',
    zeros: 1,
    polosLivres: 0,
    polosNaOrigem: 0,
    simboloLivre: 'z',
    simboloGanho: 'K_c',
    ganhos: (kc, z) => ({ kp: kc * z, ki: 0, kd: kc }),
  },
  {
    id: 'pi',
    nome: 'PI',
    zeros: 1,
    polosLivres: 0,
    polosNaOrigem: 1,
    simboloLivre: 'z',
    simboloGanho: 'K_c',
    ganhos: (kc, z) => ({ kp: kc, ki: kc * z, kd: 0 }),
  },
  {
    id: 'pid',
    nome: 'PID',
    zeros: 2,
    polosLivres: 0,
    polosNaOrigem: 1,
    simboloLivre: 'z',
    simboloGanho: 'K_c',
    ganhos: (kc, z) => ({ kp: 2 * kc * z, ki: kc * z * z, kd: kc }),
  },
  {
    id: 'polo',
    nome: 'controlador a/(s+b)',
    zeros: 0,
    polosLivres: 1,
    polosNaOrigem: 0,
    simboloLivre: 'b',
    simboloGanho: 'a',
    ganhos: (kc, b) => ({ a: kc, b }),
  },
  {
    id: 'compensador-zero',
    nome: 'compensador K(s+z)/(s+p)',
    zeros: 0,
    polosLivres: 1,
    polosNaOrigem: 0,
    fixo: 'zero',
    simboloLivre: 'p',
    simboloGanho: 'K',
    ganhos: (kc, p) => ({ k: kc, p }),
  },
  {
    id: 'compensador-polo',
    nome: 'compensador K(s+z)/(s+p)',
    zeros: 1,
    polosLivres: 0,
    polosNaOrigem: 0,
    fixo: 'polo',
    simboloLivre: 'z',
    simboloGanho: 'K',
    ganhos: (kc, z) => ({ k: kc, z }),
  },
  {
    id: 'atraso-avanco',
    nome: 'compensador atraso-avanço',
    zeros: 0,
    polosLivres: 1,
    polosNaOrigem: 0,
    fixo: 'zero',
    rotuloFixo: 'Zero do avanço z₁, fator (s + z₁)',
    atraso: true,
    simboloLivre: 'p',
    simboloGanho: 'K',
    latex: 'K\\,\\dfrac{(s + z_1)(s + z_2)}{(s + p_1)(s + p_2)}',
    ganhos: (kc, p) => ({ k: kc, p }),
  },
  {
    id: 'atraso',
    nome: 'compensador em atraso',
    zeros: 0,
    polosLivres: 0,
    polosNaOrigem: 0,
    pipeline: 'atraso',
    simboloLivre: 'p',
    simboloGanho: 'K',
    latex: 'K\\,\\dfrac{(s + z)}{(s + p)}',
    ganhos: () => ({}),
  },
];

export function obterControlador(id, fixo = null) {
  const encontrado = CONTROLADORES.find((controlador) => controlador.id === id);
  if (!encontrado) {
    throw new Error(`Controlador desconhecido: ${id}`);
  }
  const temFixo = encontrado.fixo && Number.isFinite(fixo);
  return {
    ...encontrado,
    zerosFixos: temFixo && encontrado.fixo === 'zero' ? [fixo] : [],
    polosFixos: temFixo && encontrado.fixo === 'polo' ? [fixo] : [],
  };
}

export function livreEhPolo(controlador) {
  return controlador.polosLivres > 0;
}

export function quantidadeLivre(controlador) {
  return controlador.zeros + controlador.polosLivres;
}

function produtoDeFatores(valores) {
  return valores.reduce((resultado, valor) => P.multiplicar(resultado, [1, valor]), [1]);
}

export function numeradorDoControlador(controlador, valor) {
  const livres = new Array(controlador.zeros).fill(valor);
  return produtoDeFatores([...livres, ...(controlador.zerosFixos || [])]);
}

export function denominadorDoControlador(controlador, valor) {
  const livres = new Array(controlador.polosLivres).fill(valor);
  const origem = [1, ...new Array(controlador.polosNaOrigem).fill(0)];
  return P.multiplicar(origem, produtoDeFatores([...livres, ...(controlador.polosFixos || [])]));
}

export function zerosFixosComoPontos(controlador) {
  return (controlador.zerosFixos || []).map((valor) => ({ re: -valor, im: 0 }));
}

export function polosFixosComoPontos(controlador) {
  return [
    ...new Array(controlador.polosNaOrigem).fill(null).map(() => ({ re: 0, im: 0 })),
    ...(controlador.polosFixos || []).map((valor) => ({ re: -valor, im: 0 })),
  ];
}

export function excessoDeZeros(controlador) {
  const zeros = controlador.zeros + (controlador.zerosFixos || []).length;
  const polos = controlador.polosNaOrigem + controlador.polosLivres + (controlador.polosFixos || []).length;
  return zeros - polos;
}
