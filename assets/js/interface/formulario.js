import { interpretarCoeficientes, interpretarNumero } from '../nucleo/entrada.js';

export const CAMPOS = {
  nG: 'numerador-g',
  dG: 'denominador-g',
  nH: 'numerador-h',
  dH: 'denominador-h',
  controlador: 'controlador',
  modo: 'modo',
  sobressinal: 'sobressinal',
  acomodacao: 'acomodacao',
  criterio: 'criterio',
  zeta: 'zeta',
  omegaN: 'omega-n',
  poloReal: 'polo-real',
  poloImaginario: 'polo-imaginario',
};

export const CAMPOS_FIXOS = ['nG', 'dG', 'nH', 'dH', 'controlador', 'modo'];

export const CAMPOS_POR_MODO = {
  desempenho: ['sobressinal', 'acomodacao', 'criterio'],
  amortecimento: ['zeta', 'omegaN'],
  polos: ['poloReal', 'poloImaginario'],
};

export function campo(nome) {
  return document.getElementById(CAMPOS[nome]);
}

function numero(nome) {
  return interpretarNumero(campo(nome).value, NaN);
}

export function atualizarModo() {
  const modo = campo('modo').value;
  document.querySelectorAll('[data-modo]').forEach((painel) => {
    painel.hidden = painel.dataset.modo !== modo;
  });
}

export function conectarModos() {
  campo('modo').addEventListener('change', atualizarModo);
  atualizarModo();
}

function lerDesempenho() {
  const sobressinal = numero('sobressinal');
  const acomodacao = numero('acomodacao');
  if (!(sobressinal > 0 && sobressinal < 100)) {
    return { erro: 'O sobressinal $M_P$ precisa ficar entre $0\\%$ e $100\\%$, sem os extremos.' };
  }
  if (!(acomodacao > 0)) {
    return { erro: 'O tempo de acomodação $t_s$ precisa ser positivo.' };
  }
  return {
    especificacao: { modo: 'desempenho', sobressinal, acomodacao, criterio: Number(campo('criterio').value) },
  };
}

function lerAmortecimento() {
  const zeta = numero('zeta');
  const omegaN = numero('omegaN');
  if (!(zeta > 0 && zeta < 1)) {
    return { erro: 'O fator de amortecimento $\\zeta$ precisa ficar entre $0$ e $1$ para gerar polos complexos.' };
  }
  if (!(omegaN > 0)) {
    return { erro: 'A frequência natural $\\omega_n$ precisa ser positiva.' };
  }
  return { especificacao: { modo: 'amortecimento', zeta, omegaN } };
}

function lerPolos() {
  const real = numero('poloReal');
  const imaginario = Math.abs(numero('poloImaginario'));
  if (!(real < 0)) {
    return { erro: 'A parte real dos polos desejados precisa ser negativa.' };
  }
  if (!(imaginario > 0)) {
    return { erro: 'A parte imaginária dos polos desejados precisa ser diferente de zero.' };
  }
  return { especificacao: { modo: 'polos', real, imaginario } };
}

const LEITORES = {
  desempenho: lerDesempenho,
  amortecimento: lerAmortecimento,
  polos: lerPolos,
};

export function lerEspecificacao() {
  const leitor = LEITORES[campo('modo').value];
  return leitor ? leitor() : { erro: 'Escolha como a especificação será informada.' };
}

export function lerCoeficientes() {
  return ['nG', 'dG', 'nH', 'dH'].map((nome) => interpretarCoeficientes(campo(nome).value));
}

export function lerFormulario() {
  const [nG, dG, nH, dH] = lerCoeficientes();

  if ([nG, dG, nH, dH].some((item) => item === null)) {
    return { erro: 'Confira os coeficientes: use números separados por espaço, em ordem decrescente de $s$.' };
  }
  if ([nG, dG, nH, dH].some((item) => item.every((v) => v === 0))) {
    return { erro: 'Nenhum numerador ou denominador de $G(s)$ e $H(s)$ pode ser nulo.' };
  }

  const leitura = lerEspecificacao();
  if (leitura.erro) {
    return leitura;
  }

  return {
    entrada: { nG, dG, nH, dH, controlador: campo('controlador').value, especificacao: leitura.especificacao },
  };
}
