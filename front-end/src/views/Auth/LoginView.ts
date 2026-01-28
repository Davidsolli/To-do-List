import { Component } from '../../core/Component';
import { Input } from '../../components/Input/Input';   // Lógica do Input
import { Button } from '../../components/Button/Button'; // Lógica do Button
import template from './LoginView.html';
import './AuthViews.css';
import { Validator } from '../../utils/Validator';
import { AuthService } from '../../services/AuthService';

export class LoginView extends Component {
  getTemplate(): string {
    // 1. Instanciar Componentes
    const emailInput = new Input({
      id: 'email',
      label: 'E-mail:',
      type: 'email',
      placeholder: 'exemplo@email.com',
    });

    const passwordInput = new Input({
      id: 'password',
      label: 'Senha:',
      type: 'password',
      placeholder: '••••••••',
    });

    const submitBtn = new Button({
      text: 'Entrar',
      type: 'submit',
      fullWidth: true,
      action: 'submit-login',
      variant: 'primary',
    });

    // 2. Injetar no Template Principal
    // No seu LoginView.html, você deve ter marcações como {{email_component}}
    return template
      .replace('{{email_component}}', emailInput.render())
      .replace('{{password_component}}', passwordInput.render())
      .replace('{{login_button_component}}', submitBtn.render())
  }

  protected afterRender(): void {
    // ... seus outros códigos ...

    // Lógica do Form
    const form = this.container.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = this.container.querySelector('#email') as HTMLInputElement;
        const passwordInput = this.container.querySelector('#password') as HTMLInputElement;

        // Limpar erros anteriores
        this.clearErrors();

        let hasError = false;

        if (!Validator.isEmail(emailInput.value)) {
          this.showError('email', 'Por favor, insira um e-mail válido.');
          hasError = true;
        }

        if (Validator.isEmpty(passwordInput.value)) {
          this.showError('password', 'Por favor, insira sua senha.');
          hasError = true;
        }

        if (hasError) return;

        // Se passar na validação, prosseguir com login
        const submitBtn = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Carregando...';

        AuthService.login(emailInput.value, passwordInput.value)
          .then((user) => {
            window.toast.success(`Bem-vindo, ${user.name}!`);
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          })
          .catch((err) => {
            window.toast.error(err.message || 'Falha no login');
          })
          .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
          });
      });
    }



    // Lógica Genérica para qualquer botão de "olhinho" na tela
    const toggleBtns = this.container.querySelectorAll('[data-action="toggle-password"]');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target'); // Pega o ID do input alvo
        if (targetId) {
          const input = this.container.querySelector(`#${targetId}`) as HTMLInputElement;
          const icon = btn.querySelector('i');

          if (input.type === 'password') {
            input.type = 'text';
            icon?.classList.replace('fa-eye', 'fa-eye-slash'); // Muda ícone
          } else {
            input.type = 'password';
            icon?.classList.replace('fa-eye-slash', 'fa-eye'); // Restaura ícone
          }
        }
      });
    });
  }

  private showError(inputId: string, message: string): void {
    const errorEl = this.container.querySelector(`#error-${inputId}`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  private clearErrors(): void {
    const errors = this.container.querySelectorAll('.form-error');
    errors.forEach(el => el.textContent = '');
  }
}
