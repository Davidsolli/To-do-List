# Integração do Sidebar - Guia de Uso

## Estrutura

O **Sidebar.html** é um componente fragmentado (sem `<html>`, `<head>`, `<body>` completos). Ele deve ser integrado em uma página HTML principal.

## Como usar no seu projeto

### 1. Na página HTML principal (ex: index.html)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlphaTask</title>
    
    <!-- Importar styles globais -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined">
    <link rel="stylesheet" href="./styles/main.css">
    <link rel="stylesheet" href="./components/sidebar.css">
</head>
<body>
    <!-- Incluir Sidebar -->
    <div id="sidebar-container"></div>

    <!-- Resto do conteúdo da página -->
    <main id="app-content">
        <!-- Seu conteúdo aqui -->
    </main>

    <!-- Carregar sidebar como fragmento -->
    <script>
        fetch('./components/Sidebar.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('sidebar-container').innerHTML = html;
                
                // Agora inicializar o sidebar com dados do usuário
                if (window.sidebarManager) {
                    // Obter dados do usuário (do localStorage, sessionStorage ou API)
                    const userName = localStorage.getItem('userName') || 'Usuário';
                    const isAdmin = localStorage.getItem('isAdmin') === 'true';
                    
                    window.sidebarManager.initializeWithUser(userName, isAdmin);
                }
            })
            .catch(error => console.error('Erro ao carregar sidebar:', error));
    </script>
</body>
</html>
```

### 2. Inicializar o Sidebar com dados do usuário

Após fazer login, chame:

```javascript
// Com os dados do usuário logado
window.sidebarManager.initializeWithUser('João Silva', true); // nome, isAdmin
```

Ou obtenha do seu estado de aplicação:

```javascript
const userData = getCurrentUser(); // Sua função que retorna dados do usuário
window.sidebarManager.initializeWithUser(userData.full_name, userData.is_admin);
```

### 3. Atualizar o item ativo da sidebar

```javascript
// Navegar para uma rota específica
window.sidebarManager.setActiveItem('projetos'); // projetos, equipe, configuracoes
```

## Funcionalidades

### Dark Mode Toggle
- Ativa/desativa automaticamente
- Persiste em `localStorage` com chave `darkMode`
- Adiciona classe `dark-mode` ao `<html>`

### Logout
- Clique no botão de logout dispara evento `userLogout`
- Limpa dados de sessionStorage
- Redireciona para `/login`

### Item Admin
- O item "Equipe" só aparece se `isAdmin` for `true`
- Use `initializeWithUser(name, true)` para mostrar

### Eventos Customizados

```javascript
// Evento de navegação
window.addEventListener('sidebar-navigate', (e) => {
    console.log('Rota:', e.detail.route); // projetos, equipe, configuracoes
});

// Evento de dark mode toggle
window.addEventListener('darkModeToggle', (e) => {
    console.log('Dark mode ativado:', e.detail.isDarkMode);
});

// Evento de logout
window.addEventListener('userLogout', () => {
    console.log('Usuário saindo...');
});
```

## Regras de Visibilidade

- ✅ Mostrar em: **Todas as páginas exceto Login e Cadastro**
- ✅ Logo: Usa `logo-white.svg` (claro) e `logo-dark.svg` (escuro)
- ✅ Menu: Projetos, Equipe (só admin), Configurações
- ✅ Footer: Nome do usuário, dark mode toggle, logout

## Estilos

- Usa variáveis CSS de `/styles/variables.css`
- Responsivo em desktop, tablet e mobile
- Suporta dark mode via classe `.dark-mode` no `<html>`
- Respira as cores da marca (#13EC5B)

## Integração com Router

Se estiver usando um router (como o seu `Router.ts`), dispare a navegação no listener:

```javascript
window.addEventListener('sidebar-navigate', (e) => {
    // Usar seu router para navegar
    router.navigate(e.detail.route);
});
```
