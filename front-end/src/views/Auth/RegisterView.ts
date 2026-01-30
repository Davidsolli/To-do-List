import { Component } from '../../core/Component';
import { Input } from '../../components/Input/Input';   // Lógica do Input
import { Button } from '../../components/Button/Button'; // Lógica do Button
import template from './RegisterView.html';
import './AuthViews.css';
import { Validator } from '../../utils/Validator';
import { AuthService } from '../../services/AuthService';
import { app } from '../../App';

export class RegisterView extends Component {
  getTemplate(): string {
    // 1. Instanciar Componentes
    const nameInput = new Input({
      id: 'name',
      label: 'Nome:',
      type: 'text',
      placeholder: 'Insira seu nome',
    });

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
      text: 'Cadastrar',
      type: 'submit',
      fullWidth: true,
      action: 'submit-Register',
      variant: 'primary',
    });

    // 2. Injetar no Template Principal
    // No seu RegisterView.html, você deve ter marcações como {{email_component}}
    return template
      .replace('{{name_component}}', nameInput.render())
      .replace('{{email_component}}', emailInput.render())
      .replace('{{password_component}}', passwordInput.render())
      .replace('{{register_button_component}}', submitBtn.render())
  }

  protected afterRender(): void {
    // ... seus outros códigos ...

    // Lógica do Form
    const form = this.container.querySelector('#register-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = this.container.querySelector('#name') as HTMLInputElement;
        const emailInput = this.container.querySelector('#email') as HTMLInputElement;
        const passwordInput = this.container.querySelector('#password') as HTMLInputElement;

        // Limpar erros anteriores
        this.clearErrors();

        let hasError = false;

        if (!Validator.isNameValid(nameInput.value)) {
          this.showError('name', 'Por favor, insira um nome válido (mínimo 4 letras).');
          hasError = true;
        }

        if (!Validator.isEmail(emailInput.value)) {
          this.showError('email', 'Por favor, insira um e-mail válido.');
          hasError = true;
        }

        if (!Validator.isPasswordStrong(passwordInput.value)) {
          this.showError('password', 'A senha deve ter no mínimo 8 caracteres, incluir letras, números e símbolos.');
          hasError = true;
        }

        if (hasError) return;

        // Se passar na validação, prosseguir com cadastro
        const submitBtn = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Carregando...';

        AuthService.register(nameInput.value, emailInput.value, passwordInput.value)
          .then(() => {
            window.toast.success('Cadastro realizado com sucesso! Faça login.');
            setTimeout(() => {
              app.navigate('/login');
            }, 1000);
          })
          .catch((err) => {
            window.toast.error(err.message || 'Falha no cadastro');
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
    const errorEl = this.container.querySelector(`#error-${inputId}`) as HTMLElement;
    const inputEl = this.container.querySelector(`#${inputId}`) as HTMLInputElement;

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    if (inputEl) {
      inputEl.classList.add('error');
    }
  }

  private clearErrors(): void {
    const errors = this.container.querySelectorAll('.form-error');
    errors.forEach((el) => {
      (el as HTMLElement).textContent = '';
      (el as HTMLElement).style.display = 'none';
    });

    const inputs = this.container.querySelectorAll('.form-input');
    inputs.forEach((input) => {
      input.classList.remove('error');
    });
  }
}
