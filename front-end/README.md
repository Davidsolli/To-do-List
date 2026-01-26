# 🚀 AlphaTask - Frontend

Este repositório contém o código-fonte do front-end da aplicação **AlphaTask**.
O projeto foi construído utilizando **TypeScript puro** e **CSS3** (sem frameworks como React/Vue/Angular), adotando uma arquitetura **SPA (Single Page Application)** baseada em Componentes e Orientação a Objetos.

---

## 🛠 Tech Stack

* **Linguagem:** TypeScript (ES6+)
* **Estilização:** CSS3 Puro (com Variáveis CSS e BEM)
* **Bundler:** Webpack 5
* **Testes:** Mocha & Chai
* **Arquitetura:** Custom Component System & Router

---

## ⚙️ Instalação e Execução

### Pré-requisitos
* Node.js (v16 ou superior)
* npm

### Passo a Passo

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Rodar em Desenvolvimento (Hot Reload):**
    ```bash
    npm start
    ```
    O projeto rodará em `http://localhost:3000`.

3.  **Rodar Testes Unitários:**
    ```bash
    npm test
    ```

4.  **Build de Produção:**
    ```bash
    npm run build
    ```
    Os arquivos otimizados serão gerados na pasta `/dist`.

---

## 📂 Estrutura do Projeto

Adotamos o padrão **"Componente como Diretório"**. Cada parte da interface é uma pasta contendo sua lógica, template e estilo.

```text
/src
  ├── /components           # Componentes Reutilizáveis (Botões, Cards, Modais)
  │   └── /TaskCard
  │       ├── TaskCard.ts   # Lógica (Classe)
  │       ├── TaskCard.html # Template (HTML Puro)
  │       └── TaskCard.css  # Estilo (Scoped via BEM)
  ├── /core                 # O "Coração" do Framework Customizado
  │   ├── Component.ts      # Classe Base Abstrata
  │   └── Router.ts         # Motor de Navegação SPA
  ├── /models               # Interfaces TypeScript (User, Task, Project)
  ├── /services             # Comunicação com API e Auth
  ├── /styles               # CSS Global
  │   ├── main.css          # Reset e Imports
  │   └── variables.css     # Design System (Cores, Fontes)
  ├── /views                # Páginas (Controladores de Tela)
  │   ├── /Login
  │   └── /Dashboard
  ├── /utils                # Validadores, Formatadores
  ├── App.ts                # Inicializador da Aplicação
  ├── routes.ts             # Mapa de Rotas (URL -> View)
  └── index.ts              # Entry Point do Webpack

/tests                      # Testes Unitários (Espelha a estrutura do src)
  ├── /services             # Testes de Regras de Negócio e API
  │   └── AuthService.test.ts
  ├── /utils                # Testes de Validadores e Helpers
  │   └── Validator.test.ts
  └── setup.ts              # Configurações globais do Mocha (se necessário)
```

---

## 🏗 Arquitetura e Padrões

### 1. Componentes (`src/core/Component.ts`)

Todo elemento visual herda da classe base `Component`.

* **`getTemplate()`**: Retorna a string HTML (importada via `html-loader`).
* **`render()`**: Injeta o HTML no DOM.
* **`afterRender()`**: Local para adicionar `addEventListener` e lógica pós-renderização.

**Exemplo de Componente:**

```typescript
import { Component } from '../../core/Component';
import template from './MyComponent.html';
import './MyComponent.css';

export class MyComponent extends Component {
  getTemplate(): string {
    return template;
  }

  protected afterRender(): void {
    const btn = this.container.querySelector('[data-action="save"]');
    btn?.addEventListener('click', () => console.log('Salvo!'));
  }
}

```

### 2. Importação de HTML

Graças ao Webpack e o arquivo `src/types/custom.d.ts`, podemos importar arquivos `.html` como strings dentro do TypeScript. Isso mantém o HTML limpo e com syntax highlighting.

### 3. Roteamento

O `Router` manipula a History API do navegador. Não use tags `<a href="...">` tradicionais para navegação interna.
**Como navegar:**

```typescript
import { router } from '../../App'; // Supondo exportação singleton ou instância global

// Correto (SPA):
button.addEventListener('click', () => {
  router.navigate('/dashboard');
});

```

---

## 🎨 Guia de Estilos (Design System)

Utilizamos **CSS Variables** definidas em `src/styles/variables.css`. Sempre use variáveis, nunca cores hexadecimais "hardcoded" nos componentes.

### Paleta Principal

| Variável | Cor | Uso |
| --- | --- | --- |
| `--color-primary` | `#13EC5B` | Botões, Logo, Ações Principais |
| `--color-primary-light` | `#A1E7A8` | Hover, Detalhes sutis |
| `--bg-page` | `#F6F8F6` | Fundo geral da aplicação |
| `--bg-surface` | `#F0F0F2` | Cards, Sidebar |

### Sistema de Prioridade (Urgency)

Usado para indicar o nível de criticidade da tarefa.

* 🔴 **Alta:** `--priority-high-bg` (Fundo) / `--priority-high-dot` (Ícone)
* 🟡 **Média:** `--priority-mid-bg` (Fundo) / `--priority-mid-dot` (Ícone)
* 🟢 **Baixa:** `--priority-low-bg` (Fundo) / `--priority-low-dot` (Ícone)

### Sistema de Status (Kanban)

Usado para indicar o fluxo de trabalho.

* 🔵 **Fazendo:** `--status-doing-bg` / `--status-doing-dot`
* ⚪ **Pendente:** `--status-todo-bg` / `--status-todo-dot`
* 🟢 **Concluído:** `--status-done-bg` / `--status-done-dot`

### Metodologia CSS (BEM)

Use **Block Element Modifier** para nomear classes e evitar conflitos.

```css
/* Bloco */
.task-card {}

/* Elemento */
.task-card__title {}
.task-card__button {}

/* Modificador */
.task-card--completed {}
.button--primary {}

```

---

## 📏 Convenções de Código

Para manter a consistência e a qualidade do código, seguimos regras estritas de desenvolvimento.

### 1. Nomenclatura (Naming Conventions)

* **Arquivos e Pastas:**
* **Components/Views:** Use `PascalCase`. O nome do arquivo deve ser idêntico ao da classe exportada.
* ✅ `TaskCard.ts`, `LoginView.ts`
* ❌ `taskCard.ts`, `login-view.ts`


* **Utils/Services:** Use `PascalCase` para Classes e `camelCase` para instâncias ou funções isoladas.
* ✅ `AuthService.ts`, `dateUtils.ts`




* **Variáveis e Métodos:**
* Use `camelCase`.
* Booleanos devem indicar pergunta/estado: `isActive`, `hasError`, `canSubmit`.


* **Event Handlers:**
* Use o prefixo `handle` seguido do evento ou ação.
* ✅ `handleClick()`, `handleSubmit()`, `handleDeleteProject()`



### 2. Interação com o DOM (Separação de Preocupações)

Nunca acople o CSS (Estilo) com o JavaScript (Comportamento). Se um designer mudar o nome de uma classe CSS, o código JS não pode quebrar.

* **Seletores de JavaScript:** Use **Data Attributes** exclusivos.
* `data-action="..."`: Para elementos clicáveis (botões, links).
* `data-bind="..."`: Para elementos onde o texto/conteúdo será alterado dinamicamente.
* `data-id="..."`: Para armazenar IDs de banco de dados no elemento HTML.



**Exemplo Prático:**

```html
<div class="task-card">
  <h3 class="task-card__title" data-bind="title"></h3>
  
  <button class="btn-danger" data-action="delete" data-id="42">Excluir</button>
</div>

```

```typescript
// TypeScript (Component)
protected afterRender(): void {
    // Busca elemento de ação
    const deleteBtn = this.container.querySelector('[data-action="delete"]');
    
    // Pega o ID sem depender de classes ou hierarquia complexa
    const id = deleteBtn?.getAttribute('data-id');
}

```

### 3. TypeScript e Tipagem

* **No `any`:** O uso de `any` é estritamente desencorajado. Crie uma interface no diretório `/models` se o tipo não existir.
* **Interfaces:** Use `PascalCase`. Não use prefixo "I" (ex: use `User` em vez de `IUser`).
* **Retorno de Métodos:** Sempre tipar o retorno das funções, mesmo que seja `void`.

```typescript
// ❌ Ruim
function soma(a, b) { return a + b; }

// ✅ Bom
function soma(a: number, b: number): number { return a + b; }

```

### 4. Organização da Classe (Componente)

Para evitar "Classes Deus" (God Classes) bagunçadas, siga esta ordem de declaração dentro do arquivo `.ts`:

1. **Propriedades** (`private container`, `private state`)
2. **Constructor**
3. **Métodos Públicos** (`render`, `update`)
4. **Método `getTemplate**` (Abstrato)
5. **Método `afterRender**` (Ciclo de vida)
6. **Métodos Privados de Eventos** (`bindEvents`, `handleClicks`)
7. **Métodos Privados Auxiliares** (`formatDate`, `calculateTotal`)

**Exemplo de Estrutura Limpa:**

```typescript
export class ExampleView extends Component {
  // 1. Props
  private state: any;

  // 2. Constructor
  constructor(root: string) { super(root); }

  // 3. Template
  getTemplate(): string { return htmlString; }

  // 4. Ciclo de Vida (Onde a mágica acontece)
  protected afterRender(): void {
    this.bindEvents(); // Delega para método privado
    this.updateUI();   // Delega para método privado
  }

  // 5. Organização de Eventos
  private bindEvents(): void {
    const btn = this.container.querySelector('[data-action="save"]');
    btn?.addEventListener('click', (e) => this.handleSave(e));
  }

  // 6. Handlers
  private handleSave(e: Event): void {
    // Lógica de salvar
  }
}

```

### 5. CSS e Estilização (BEM)

* **Variáveis:** Nunca use cores hexadecimais (`#FFF`) diretamente nos arquivos `.css` de componentes. Use as variáveis definidas em `variables.css`.
* **Metodologia BEM:**
* **Block:** O componente principal (`.modal`).
* **Element:** Uma parte interna (`.modal__header`, `.modal__close-btn`).
* **Modifier:** Uma variação de estado (`.modal--open`, `.btn--primary`).



```css
/* ✅ Bom */
.task-card__title {
    color: var(--text-main);
    font-weight: bold;
}

/* ❌ Ruim (Não use IDs para estilo, não use nesting profundo) */
#card-title h3 {
    color: #333; 
}

```
---

## 🧪 Testes

Utilizamos **Mocha** e **Chai**. Os testes focam na lógica de negócios, validadores e serviços.

Para criar um novo teste:

1. Crie um arquivo `.test.ts` dentro de `/tests`.
2. Importe o módulo a ser testado.
3. Descreva os cenários (`describe`, `it`).

```bash
npm test

```
