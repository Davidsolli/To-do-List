import { Component } from '../../core/Component';
import { Input } from '../../components/Input/Input';   // Lógica do Input
import { Button } from '../../components/Button/Button'; // Lógica do Button
import template from './LoginView.html';
import './AuthViews.css';

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
}