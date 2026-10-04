const EPS = 1e-14;

export function normalizar(p) {
  let i = 0;
  while (i < p.length - 1 && Math.abs(p[i]) < EPS) {
    i += 1;
  }
  return p.slice(i);
}

export function preencher(p, tamanho) {
  if (p.length >= tamanho) {
    return p.slice();
  }
  return new Array(tamanho - p.length).fill(0).concat(p);
}

export function somar(a, b) {
  const n = Math.max(a.length, b.length);
  const x = preencher(a, n);
  const y = preencher(b, n);
  return x.map((v, i) => v + y[i]);
}

export function multiplicar(a, b) {
  if (a.length === 0 || b.length === 0) {
    return [0];
  }
  const saida = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      saida[i + j] += a[i] * b[j];
    }
  }
  return saida;
}

export function escalar(p, k) {
  return p.map((v) => v * k);
}

export function derivar(p) {
  const g = p.length - 1;
  if (g <= 0) {
    return [0];
  }
  const saida = [];
  for (let i = 0; i < g; i += 1) {
    saida.push(p[i] * (g - i));
  }
  return saida;
}

export function avaliar(p, x) {
  let acumulado = 0;
  for (let i = 0; i < p.length; i += 1) {
    acumulado = acumulado * x + p[i];
  }
  return acumulado;
}

export function avaliarComplexo(p, z) {
  let re = 0;
  let im = 0;
  for (let i = 0; i < p.length; i += 1) {
    const novoRe = re * z.re - im * z.im + p[i];
    im = re * z.im + im * z.re;
    re = novoRe;
  }
  return { re, im };
}

export function grau(p) {
  return normalizar(p).length - 1;
}

export function maiorCoeficiente(p) {
  return p.reduce((maior, v) => Math.max(maior, Math.abs(v)), 0);
}

