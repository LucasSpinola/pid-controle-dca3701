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
];

export function obterControlador(id) {
  const encontrado = CONTROLADORES.find((controlador) => controlador.id === id);
  if (!encontrado) {
    throw new Error(`Controlador desconhecido: ${id}`);
  }
  return encontrado;
}

export function livreEhPolo(controlador) {
  return controlador.polosLivres > 0;
}

export function quantidadeLivre(controlador) {
  return controlador.zeros + controlador.polosLivres;
}

function potenciaDoFator(quantidade, valor) {
  let resultado = [1];
  for (let i = 0; i < quantidade; i += 1) {
    resultado = P.multiplicar(resultado, [1, valor]);
  }
  return resultado;
}

export function numeradorDoControlador(controlador, valor) {
  return potenciaDoFator(controlador.zeros, valor);
}

export function denominadorDoControlador(controlador, valor) {
  const origem = [1, ...new Array(controlador.polosNaOrigem).fill(0)];
  return P.multiplicar(origem, potenciaDoFator(controlador.polosLivres, valor));
}

export function excessoDeZeros(controlador) {
  return controlador.zeros - controlador.polosNaOrigem - controlador.polosLivres;
}
