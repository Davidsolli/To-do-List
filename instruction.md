# Guia de Desenvolvimento de Features

Este documento descreve o fluxo padrão para desenvolvimento de funcionalidades no projeto.

## Pré-requisitos

- Acesso ao GitHub Project do projeto
- Git instalado e configurado
- Repositório clonado localmente

## Fluxo de Trabalho

### 1. Pegue uma Task no GitHub Project

1. Acesse o GitHub Project do repositório
2. Navegue até a coluna "To Do" ou "Backlog"
3. Escolha uma task disponível
4. Mova a task para a coluna "In Progress"
5. Atribua a task para você mesmo
6. Anote o número e nome da issue/task (exemplo: `#123 - Adicionar botão de login`)

### 2. Crie uma Nova Branch

Sempre crie uma branch a partir da branch principal (`main` ou `develop`) atualizada:
```bash
# Certifique-se de estar na branch principal
git checkout main

# Atualize a branch principal
git pull origin main

# Crie e mude para a nova branch
git checkout -b nome-da-sua-task
```

**Padrão de nomenclatura de branches:**
- `feature/123-adicionar-botao-login` - para novas funcionalidades
- `fix/123-corrigir-erro-login` - para correções de bugs
- `docs/123-atualizar-readme` - para documentação

**Exemplo:**
```bash
git checkout -b feature/123-adicionar-botao-login
```

### 3. Desenvolva a Funcionalidade

Desenvolva sua funcionalidade normalmente. Lembre-se de:

- Testar suas alterações localmente
- Seguir os padrões de código do projeto
- Manter o código limpo e legível

#### Commits usando Conventional Commits

Faça commits pequenos e frequentes seguindo o padrão **Conventional Commits**:

**Formato:**
```
<tipo>: <descrição curta>

[corpo opcional]

[rodapé opcional]
```

**Tipos de commit:**
- `feat`: Uma nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Formatação, ponto e vírgula faltando, etc (sem mudança de código)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Atualizações de tarefas de build, configurações, etc

**Exemplos:**
```bash
# Adicionar nova funcionalidade
git add .
git commit -m "feat: adicionar botão de login na página inicial"

# Corrigir um bug
git commit -m "fix: corrigir validação de email no formulário"

# Atualizar documentação
git commit -m "docs: adicionar instruções de instalação no README"

# Refatorar código
git commit -m "refactor: simplificar lógica de autenticação"
```

**Commit com corpo e rodapé:**
```bash
git commit -m "feat: adicionar sistema de autenticação
```

### 4. Suba a Implementação para o GitHub

Após finalizar o desenvolvimento e fazer todos os commits:
```bash
# Envie sua branch para o GitHub
git push origin nome-da-sua-branch
```

**Exemplo:**
```bash
git push origin feature/123-adicionar-botao-login
```

Se for o primeiro push da branch, o Git pode sugerir o comando completo:
```bash
git push --set-upstream origin feature/123-adicionar-botao-login
```

### 5. Abra um Pull Request

1. Acesse o repositório no GitHub
2. Você verá um banner sugerindo criar um Pull Request da sua branch recém enviada
3. Clique em **"Compare & pull request"**
4. Preencha as informações do PR:

**Título do PR:**
- Use um título claro e descritivo
- Exemplo: `feat: Adicionar botão de login na página inicial`

**Descrição do PR:**
```markdown
## Descrição
Breve descrição do que foi implementado.

## Mudanças
- Item 1
- Item 2
- Item 3

## Como testar
1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)
[Adicione imagens se necessário]

Closes #123
```

5. Selecione um **revisor** (responsável) no campo "Reviewers"
6. Adicione labels apropriadas se necessário
7. Clique em **"Create pull request"**

### 6. Acompanhe o Review

- Fique atento aos comentários do revisor
- Responda às solicitações de mudança
- Faça os ajustes necessários e faça push novamente (os commits serão adicionados ao PR automaticamente)
- Após aprovação, o responsável fará o merge

## Dicas Importantes

✅ **Boas práticas:**
- Mantenha commits pequenos e focados
- Escreva mensagens de commit claras
- Teste antes de fazer push
- Mantenha o PR focado em uma única funcionalidade
- Comunique-se com a equipe em caso de dúvidas

❌ **Evite:**
- Commits gigantes com muitas alterações
- Mensagens de commit genéricas como "fix" ou "update"
- Fazer push de código não testado
- Misturar múltiplas funcionalidades em um único PR

## Comandos Úteis
```bash
# Ver status das alterações
git status

# Ver histórico de commits
git log --oneline

# Ver diferenças antes de commitar
git diff

# Desfazer alterações não commitadas
git checkout -- nome-do-arquivo

# Atualizar sua branch com a main
git checkout main
git pull origin main
git checkout sua-branch
git merge main
```

## Precisa de Ajuda?

Em caso de dúvidas ou problemas:
1. Consulte a documentação do projeto
2. Peça ajuda no canal da equipe
3. Entre em contato com um membro mais experiente

---

**Lembre-se:** Este fluxo existe para manter o projeto organizado e facilitar a colaboração. Não hesite em pedir ajuda! 🚀
