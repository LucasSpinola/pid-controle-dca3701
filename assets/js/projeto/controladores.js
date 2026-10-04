import * as P from '../nucleo/polinomio.js';

const CONTROLADORES = [
  {
    id: 'pd',
    nome: 'PD',
    zeros: 1,
    polosNaOrigem: 0,
    ganhos: (kc, z) => ({ kp: kc * z, ki: 0, kd: kc }),
  },
  {
    id: 'pi',
    nome: 'PI',
    zeros: 1,
    polosNaOrigem: 1,
    ganhos: (kc, z) => ({ kp: kc, ki: kc * z, kd: 0 }),
  },
  {
    id: 'pid',
    nome: 'PID',
    zeros: 2,
    polosNaOrigem: 1,
    ganhos: (kc, z) => ({ kp: 2 * kc * z, ki: kc * z * z, kd: kc }),
  },
];

export function obterControlador(id) {
  const encontrado = CONTROLADORES.find((controlador) => controlador.id === id);
  if (!encontrado) {
    throw new Error(`Controlador desconhecido: ${id}`);
  }
  return encontrado;
}

export function numeradorDoControlador(controlador, z) {
  let numerador = [1];
  for (let i = 0; i < controlador.zeros; i += 1) {
    numerador = P.multiplicar(numerador, [1, z]);
  }
  return numerador;
}

export function denominadorDoControlador(controlador) {
  return [1, ...new Array(controlador.polosNaOrigem).fill(0)];
}

export function excessoDeZeros(controlador) {
  return controlador.zeros - controlador.polosNaOrigem;
}
