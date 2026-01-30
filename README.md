# 📋 To-Do List - Sistema de Gerenciamento de Projetos e Tarefas

Sistema completo de gerenciamento de projetos com funcionalidades de autenticação, controle de tarefas, kanban board e integração com IA para sugestões de tarefas.

## 📑 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
  - [Desenvolvimento Local](#desenvolvimento-local)
  - [Deploy em Produção](#deploy-em-produção)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

Sistema web moderno para gerenciamento de projetos e tarefas com interface intuitiva e recursos avançados como:
- Sistema de autenticação completo (login/registro)
- Gerenciamento de múltiplos projetos
- Quadro Kanban para visualização de tarefas
- Integração com IA (Groq) para sugestões inteligentes de tarefas
- Interface responsiva e moderna

## ✨ Funcionalidades

### 🔐 Autenticação
- [x] Registro de usuários com validação de dados
- [x] Login com JWT (JSON Web Token)
- [x] Proteção de rotas
- [x] Gerenciamento de sessão com cookies HTTP-only
- [x] Usuário admin padrão pré-configurado

### 📊 Projetos
- [x] Criar, editar e excluir projetos
- [x] Visualização de todos os projetos
- [x] Detalhes do projeto com tarefas associadas
- [x] Filtros e busca

### ✅ Tarefas
- [x] CRUD completo de tarefas
- [x] Status: To Do, In Progress, Done
- [x] Prioridades: Baixa, Média, Alta
- [x] Datas de vencimento
- [x] Vinculação a projetos

### 🎨 Interface
- [x] Design moderno e responsivo
- [x] Tema dark/light (em desenvolvimento)
- [x] Quadro Kanban drag-and-drop
- [x] Modais e formulários validados
- [x] Feedback visual de ações

### 🤖 IA
- [x] Sugestões automáticas de tarefas usando Groq API
- [x] Análise de contexto do projeto
- [x] Geração de tarefas baseadas em descrição

## 🛠 Tecnologias Utilizadas

### Frontend
- **TypeScript** - Tipagem estática
- **React** (via TypeScript) - Biblioteca UI
- **Webpack** - Bundler e build tool
- **CSS3** - Estilização
- **Fetch API** - Requisições HTTP

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Desenvolvimento type-safe
- **SQLite** (better-sqlite3) - Banco de dados
- **JWT** (jsonwebtoken) - Autenticação
- **bcrypt** - Hash de senhas
- **CORS** - Controle de acesso
- **cookie-parser** - Gerenciamento de cookies

### Integrações
- **Groq API** - IA para sugestões de tarefas

### DevOps
- **Nginx** - Reverse proxy e servidor web
- **Git** - Controle de versão
- **npm** - Gerenciador de pacotes

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│                  http://todolist.local                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   NGINX (Porta 80)                           │
│  - Serve arquivos estáticos do frontend (dist/)             │
│  - Proxy reverso para API (/api/* → localhost:3000)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ↓                       ↓
┌──────────────────────┐  ┌──────────────────────┐
│   FRONTEND (dist/)   │  │  BACKEND (Node.js)   │
│   - index.html       │  │  - Express Server    │
│   - bundle.js        │  │  - Porta 3000        │
│   - assets/          │  │  - SQLite Database   │
└──────────────────────┘  └──────────────────────┘
                                    │
                                    ↓
                          ┌──────────────────────┐
                          │   DATABASE (SQLite)  │
                          │   - users            │
                          │   - projects         │
                          │   - tasks            │
                          └──────────────────────┘
```

## 📋 Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**
- (Opcional) **Nginx** para deploy em produção

## 🚀 Instalação

### Desenvolvimento Local

#### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/To-do-List.git
cd To-do-List
```

#### 2. Configurar Backend

```bash
cd back-end

# Instalar dependências
npm install

# Criar arquivo .env
cat > .env << EOF
DB_PATH=./src/database/app.db
GROQ_API_KEY=sua_chave_groq_aqui
EOF

# Iniciar em modo desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3000`

#### 3. Configurar Frontend

```bash
cd ../front-end

# Instalar dependências
npm install

# Criar arquivo .env
cat > .env << EOF
API_URL=http://localhost:3000/api/
EOF

# Iniciar em modo desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:8080`

### Deploy em Produção

#### 1. Build do Backend

```bash
cd back-end

# Build TypeScript → JavaScript
npm run build

# Iniciar em produção
export NODE_OPTIONS="--max-old-space-size=768"
npm run prod > /var/log/backend.log 2>&1 &
```

#### 2. Build do Frontend

```bash
cd front-end

# Atualizar .env com IP/domínio de produção
echo "API_URL=http://SEU_IP_OU_DOMINIO/api/" > .env

# Build para produção
npm run build
```

Os arquivos estarão em `front-end/dist/`

#### 3. Configurar Nginx

Criar/editar `/etc/nginx/sites-available/todolist`:

```nginx
server {
    listen 80;
    server_name seu_dominio.com;

    # Frontend (arquivos estáticos)
    location / {
        root /caminho/para/To-do-List/front-end/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend (reverse proxy)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar e reiniciar:

```bash
sudo ln -s /etc/nginx/sites-available/todolist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ⚙️ Configuração

### Variáveis de Ambiente

#### Backend (`back-end/.env`)
```env
# Caminho do banco de dados SQLite
DB_PATH=./src/database/app.db

# Chave da API Groq (para IA)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# (Opcional) Segredo JWT
JWT_SECRET=seu_segredo_super_secreto

# (Opcional) Número de rounds do bcrypt
SALT=10

# (Opcional) Porta do servidor
PORT=3000

# (Opcional) Ambiente
NODE_ENV=production
```

#### Frontend (`front-end/.env`)
```env
# URL base da API (COM barra no final!)
API_URL=http://localhost:3000/api/
```

### Usuário Admin Padrão

O sistema cria automaticamente um usuário admin:
- **Email:** `admin@email.com`
- **Senha:** `Admin123` (ou conforme configurado no hash)
- **Role:** `admin`

> ⚠️ **IMPORTANTE:** Altere a senha padrão em produção!

## 📖 Uso

### Fluxo Básico

1. **Registrar/Login**
   - Acesse a aplicação
   - Crie uma conta ou faça login com o admin padrão

2. **Criar Projeto**
   - Clique em "Novo Projeto"
   - Preencha nome e descrição
   - Salve o projeto

3. **Adicionar Tarefas**
   - Entre nos detalhes do projeto
   - Clique em "Nova Tarefa"
   - Preencha os dados (título, descrição, prioridade, data)
   - Ou use a IA para gerar sugestões

4. **Gerenciar no Kanban**
   - Visualize as tarefas em colunas (To Do, In Progress, Done)
   - Arraste e solte para mudar status
   - Edite ou exclua conforme necessário

## 🔌 API Endpoints

### Autenticação

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "Senha123"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "Senha123"
}
```

```http
POST /api/auth/logout
```

### Projetos

```http
GET /api/projects
Authorization: Bearer {token}
```

```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Meu Projeto",
  "description": "Descrição do projeto"
}
```

```http
GET /api/projects/:id
Authorization: Bearer {token}
```

```http
PUT /api/projects/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "description": "Nova descrição"
}
```

```http
DELETE /api/projects/:id
Authorization: Bearer {token}
```

### Tarefas

```http
GET /api/tasks
Authorization: Bearer {token}
```

```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Minha Tarefa",
  "description": "Descrição",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-12-31",
  "project_id": 1
}
```

```http
PATCH /api/tasks/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress"
}
```

```http
DELETE /api/tasks/:id
Authorization: Bearer {token}
```

### IA

```http
POST /api/ia/suggest-tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectDescription": "Sistema de vendas online"
}
```

## 📁 Estrutura do Projeto

```
To-do-List/
├── back-end/
│   ├── src/
│   │   ├── controllers/       # Controladores (lógica de requisições)
│   │   ├── database/          # Configuração do SQLite
│   │   ├── interfaces/        # Tipos TypeScript
│   │   ├── middleware/        # Autenticação, validações
│   │   ├── repositories/      # Acesso ao banco de dados
│   │   ├── routes/            # Rotas da API
│   │   ├── services/          # Regras de negócio
│   │   ├── validations/       # Validações de dados
│   │   ├── app.ts             # Configuração Express
│   │   └── server.ts          # Inicialização do servidor
│   ├── dist/                  # Build (JavaScript compilado)
│   ├── .env                   # Variáveis de ambiente
│   ├── package.json
│   └── tsconfig.json
│
├── front-end/
│   ├── src/
│   │   ├── assets/            # Imagens, logos
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── services/          # ApiService, AuthService
│   │   ├── styles/            # CSS global
│   │   ├── utils/             # Funções auxiliares
│   │   └── index.tsx          # Entry point
│   ├── dist/                  # Build (arquivos estáticos)
│   ├── .env                   # Variáveis de ambiente
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
│
├── .git/
├── .gitignore
├── instruction.md             # Instruções do desafio
└── README.md                  # Este arquivo
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrão de Commits

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (sem mudança de código)
- `refactor:` Refatoração de código
- `test:` Testes
- `chore:` Configurações, builds

## 📄 Licença

Este projeto está sob a licença ISC.

---

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma [issue](https://github.com/seu-usuario/To-do-List/issues)
- Consulte a [documentação](./instruction.md)

---

Desenvolvido com ❤️ usando TypeScript e Node.js
