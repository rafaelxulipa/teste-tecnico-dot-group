# dot — Teste Técnico Frontend (EdTech)

Implementação da página disponibilizada no Figma, respeitando layout, interações, estados e comportamentos definidos.

## Como rodar

Não há dependências ou build steps. Basta abrir o arquivo `index.html` diretamente no navegador:

```bash
# Opção 1 — abrir direto
open index.html

# Opção 2 — servidor local simples (recomendado para evitar restrições de CORS no áudio)
npx serve .
# ou
python3 -m http.server 8080
```

## Estrutura do projeto

```
.
├── index.html                  # Página principal (single page)
├── assets/
│   ├── css/
│   │   └── style.css           # Todos os estilos (sem framework)
│   ├── js/
│   │   └── main.js             # Toda a lógica (Vanilla JS)
│   └── images/
│       ├── Container.png       # Mockup do hero
│       ├── bg-waves.png        # Background com ondas
│       ├── imagem2.png         # Imagem lateral da seção de player
│       └── image1-carrossel.png # Primeira imagem do slider
└── README.md
```

## Decisões técnicas

**Stack:** HTML5 + CSS puro + JavaScript Vanilla. Nenhum framework ou biblioteca foi utilizado, conforme exigido.

**Player de vídeo:** Embed via `<iframe>` do YouTube com `aspect-ratio` para manter responsividade. Apresentado dentro de um monitor estilizado em CSS.

**Slider:** Implementado do zero com `transform: translateX`. Suporta navegação por setas, dots, teclado (ArrowLeft/Right, Home/End) e swipe touch.

**Player de áudio:** `<audio>` nativo do HTML5 com controles completamente customizados em CSS/JS (play/pause, barra de progresso clicável, volume, mute).

**Cards interativos:** Toggle de visibilidade via `hidden` attribute + `aria-expanded` para acessibilidade.

**Atividade Discursiva e Objetiva:** Implementadas do zero, sem plugins. Todo o estado (conteúdo, resposta, feedback exibido, opção selecionada, estado dos botões) é persistido no `sessionStorage` e restaurado automaticamente ao recarregar a página.

**FAQ:** Utiliza o elemento nativo `<details>/<summary>` do HTML5. O comportamento de accordion (fechar outros ao abrir um) é adicionado via JS com o evento `toggle`.

**Acessibilidade:** HTML semântico (`<main>`, `<section>`, `<article>`, `<footer>`), atributos ARIA (`aria-label`, `aria-expanded`, `aria-live`, `aria-disabled`, `role`), navegação por teclado em todos os componentes interativos e estados de foco visíveis.
