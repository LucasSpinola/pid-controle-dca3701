<div align="center" markdown="1">

# PD, PI e PID pelo lugar das raízes

**Projeto de controladores pelo LGR com a conta inteira, passo a passo.**

### [Abrir a aplicação →](https://lucasspinola.github.io/pid-controle-dca3701/)

![Licença de código: MIT](https://img.shields.io/badge/c%C3%B3digo-MIT-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-f7df1e) ![Sem dependências](https://img.shields.io/badge/depend%C3%AAncias-nenhuma-brightgreen) ![Funciona offline](https://img.shields.io/badge/offline-sim-brightgreen)

**Lucas Augusto Spinola Pinto**<br>
DCA-3701 Projeto de Sistemas de Controle · 2ª unidade · DCA · UFRN

</div>

---

Informe $G(s)$, $H(s)$, o tipo de controlador e a especificação de malha fechada. A página encontra
os polos dominantes desejados, aplica o critério de ângulo para posicionar o zero (ou o polo) do
controlador e o critério de módulo para achar o ganho, devolve os parâmetros do controlador, confere o
projeto na resposta ao degrau simulada e, se pedido, discretiza o resultado.

**[Os passos](#os-passos)** · **[Rodar local](#rodar-local)** · **[Estrutura](#estrutura)** · **[Testes](#testes)**

## Destaques

| | |
|---|---|
| **PD, PI e PID** | o PID usa zeros reais e iguais, $G_c(s) = K_c (s+z)^2 / s$ |
| **Controlador $a/(s+b)$** | polo e ganho livres: o ângulo dá $b$ e o módulo dá $a$ |
| **Compensador $K(s+z)/(s+p)$** | com o zero ou o polo dado, o ângulo acha o outro e o módulo dá $K$ (avanço de fase) |
| **Atraso e atraso-avanço** | atraso pelo erro, com $\beta = K^{\text{comp}}/K$; atraso-avanço com a parte em avanço pelos critérios e a em atraso pelo $\beta$ |
| **Discretização** | Euler (Forward), Backward, Tustin ou invariância ao degrau (SOZ), do controlador, de $G_c G H$ ou de $G(s)$ |
| **Ferramentas avulsas** | discretizar qualquer $G(s)$ e Ziegler-Nichols, 1º e 2º métodos, com $K_{cr}$ e $P_{cr}$ tirados do modelo se preciso |
| **Seis formas de especificar** | $M_P$ e $t_s$, $M_P$ e $t_p$, $\zeta$ e $t_s$, $t_s$ e $t_p$, $\zeta$ e $\omega_n$, ou os próprios polos desejados |
| **Entrada fatorada** | $G(s)$ e $H(s)$ aceitam `5(s+3)`, `s(s+4)`, `(s+2)^2` ou a lista de coeficientes |
| **A conta, não só o resultado** | fórmula, substituição e resultado de cada passo, em LaTeX |
| **Projeto conferido** | polos de malha fechada, dominância e resposta ao degrau exata em espaço de estados |
| **Questões da lista** | cada questão do 1º e do 2º exercício preenche o formulário com um clique |
| **PDF** | **Baixar PDF** imprime o projeto aberto com o enunciado; **PDF da lista** resolve a lista inteira |
| **Link que reabre o projeto** | os campos vão para a barra de endereços |

## Os passos

| | Passo | O que aparece |
|---|---|---|
| 1 | Especificações | $\zeta$ a partir de $M_P$, $\zeta\omega_n$ a partir de $t_s$, e $\omega_d$ |
| 2 | Polos desejados | $s_d = -\sigma \pm j\omega_d$ sobre a reta de amortecimento |
| 3 | Malha aberta | $G(s)H(s)$, polos, zeros, cancelamentos e a forma de $G_c(s)$ |
| 4 | Critério de ângulo | contribuição de cada polo e zero em $s_d$ e a deficiência angular $\phi_c$ |
| 5 | Zero ou polo do controlador | $z = \sigma + \omega_d / \tan\phi_z$ (ou $b$, para $a/(s+b)$) |
| 6 | Critério de módulo | ganho total $K_t$ e o ganho do controlador $K_c = K_t/k$ |
| 6b | Parte em atraso | constante de erro atual, $\beta$, zero e polo do atraso (só no atraso-avanço) |
| 7 | Ganhos | $K_p$, $K_i$ e $K_d$ e o controlador nas formas fatorada e paralela |
| 8 | Malha fechada | $T(s)$, polos de malha fechada e a verificação de dominância |
| 9 | Resposta ao degrau | $M_P$, $t_p$ e $t_s$ simulados contra a referência de segunda ordem |
| 10 | Discretização | substituição de $s$, $G(z)$ em $z$ e $z^{-1}$, equação de diferenças e polos discretos (só quando pedida) |

O passo 8 também traz as constantes de erro estático $K_p$, $K_v$ e $K_a$. O atraso de fase puro segue
o roteiro da apostila (seção 4.6) em cinco passos próprios: ganho de malha aberta, $\beta$, controlador,
polos com e sem o atraso e resposta ao degrau comparada.

Depois dos passos vem o LGR do sistema compensado, com os polos de malha fechada no ganho projetado.
Quando o critério de ângulo não tem solução para o controlador escolhido, o roteiro para no passo 4 e
explica o motivo.

## Rodar local

A página usa módulos ES, então precisa ser servida por HTTP — abrir o `index.html` direto do disco
não funciona, o navegador bloqueia `import` em `file://`.

```bash
git clone https://github.com/LucasSpinola/pid-controle-dca3701.git
cd pid-controle-dca3701
npm start                    # ou: python -m http.server 8000
```

Depois abra <http://localhost:8000>.

**Como usar:** digite $G(s)$ e $H(s)$ como expressão, por exemplo `5(s+3)` e `s(s+4)`, ou como
coeficientes em ordem decrescente de $s$, separados por espaço — `1 4 4 0` é $s^3 + 4s^2 + 4s$. A
prévia abaixo de cada campo mostra o polinômio expandido. Escolha o controlador, a forma da
especificação e clique em **Projetar controlador**.

**PDF:** o botão **Baixar PDF**, acima do resultado, e o **PDF da lista**, ao lado das questões, abrem a
impressão do navegador. Escolha **Salvar como PDF** no destino. Todos os passos saem abertos, com os
gráficos em vetor.

## Estrutura

```
index.html              página única da aplicação
assets/
├── css/estilo.css      interface, planos e folha de impressão
├── vendor/katex/       KaTeX embarcado, sem CDN
└── js/
    ├── principal.js    ponto de entrada e orquestração
    ├── nucleo/         complexos, polinômios, raízes e matrizes
    ├── projeto/        especificações, controladores, critérios, malha fechada e degrau
    ├── formatacao/     números, controladores e conversão para LaTeX
    ├── grafico/        janela, plano SVG e camadas de desenho
    └── interface/      apresentação, formulário, questões da lista e os passos
testes/                 três suítes em Node puro
```

A direção de dependência é fixa: `nucleo` não conhece ninguém, `projeto` usa `nucleo`, `grafico` e
`formatacao` só traduzem resultados, e `interface` é a única camada que toca o DOM. Um controlador
novo entra como mais uma entrada em `projeto/controladores.js`, e as questões de outra lista entram
em `interface/exercicios.js`.

## Testes

```bash
npm run teste
```

`executar.js` cobre especificações, critérios de ângulo e de módulo, a simulação do degrau, a
discretização e as questões do 1º e do 2º exercício. `raizes.js` planta raízes de grau 2 a 8 e confere
se o solver as reencontra. `interface.js` renderiza os passos e as questões das listas sobre um DOM
falso, caçando exceção, `undefined` e `NaN`.

## Publicação

Site estático puro. Em **Settings › Pages**, escolha **Deploy from a branch**, `main` e `/ (root)`.
O `.nojekyll` na raiz impede o Jekyll de mexer nos arquivos.

## Licença

Código sob licença MIT, em [LICENSE](LICENSE). As marcas da UFRN e do DCA em `assets/img/`
pertencem às respectivas instituições e aparecem apenas para identificar a disciplina.
