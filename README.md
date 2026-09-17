# Portfólio · Italo Bernardo

<p>
  <a href="https://portfolio-italober.vercel.app/"><img src="https://img.shields.io/badge/ver_o_site-0e9a28?style=for-the-badge&labelColor=050505" alt="Ver o site"></a>
  <img src="https://img.shields.io/badge/HTML-050505?style=for-the-badge&labelColor=050505" alt="HTML">
  <img src="https://img.shields.io/badge/CSS-050505?style=for-the-badge&labelColor=050505" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-050505?style=for-the-badge&labelColor=050505" alt="JavaScript">
  <img src="https://img.shields.io/badge/sem_dependências-050505?style=for-the-badge&labelColor=050505" alt="Sem dependências">
</p>

Site pessoal de um dev backend em formação: Java, automação e integração de sistemas.
Fundo preto, um acento verde, ilustrações em linha branca fina. Três cores, nada além.

```
                    ·                  ·
         ·                    ·                 ·
                 ·        ( )         ·
     ·                   /   \                      ·
              ·         ·  ─  ·          ·
                          \   /
                           ( )        ·
         ·          ·                        ·
```

## O que tem dentro

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | Home: hero, projeto destaque, stack, missões, sobre, contato |
| `projetos.html` | Arquivo completo de projetos, com filtro por tecnologia |
| `sky.js` | Céu interativo: clique no sol dispara a supernova, cada planeta é uma seção |
| `warp.js` | Transição em hiperespaço entre as duas páginas |
| `glitch.js` | Ruído palavra por palavra nos títulos grandes |
| `i18n.js` | Português e inglês no mesmo arquivo, sem duplicar texto |
| `foto.js` | Clique na foto do projeto e ela cresce até o tamanho de leitura |

## Rodar

Não tem build nem dependência. Qualquer servidor estático resolve:

```bash
python -m http.server 8000
```

E abra `http://localhost:8000`.

## Detalhes que talvez interessem

- **Uma só passada de animação.** O sistema solar em parallax roda num único
  `requestAnimationFrame`, não um por elemento.
- **Clique no céu é geométrico.** A arte fica atrás do conteúdo com `pointer-events: none`;
  o acerto é calculado por `getScreenCTM` e só vale em área vazia.
- **Bilíngue sem duplicar HTML.** Cada elemento traduzível carrega um `data-en`; o português
  original fica em memória. Visitante fora de `pt-*` abre em inglês.
- **E-mail nunca escrito no HTML.** É montado em tempo de execução, longe dos robôs de spam.
- **Fonte do corpo com reserva metricamente igual.** Arimo entra onde não há Arial, então o
  desenho das letras não muda entre Windows, Linux e Android.

---

<p>
  <a href="https://portfolio-italober.vercel.app/">portfolio-italober.vercel.app</a> ·
  <a href="https://www.linkedin.com/in/italoBer">LinkedIn</a>
</p>
