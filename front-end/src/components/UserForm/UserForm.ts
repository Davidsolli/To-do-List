import template from './UserForm.html';
import './UserForm.css';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { User } from '../../models/User';

interface UserFormProps {
  initialData?: User;
  onSubmit: (user: Partial<User>) => void;
  onCancel: () => void;
}

export class UserForm {
  private props: UserFormProps;

  constructor(props: UserFormProps) {
    this.props = props;
  }

  public render(): string {
    const isEditing = !!this.props.initialData;

    const nameInput = new Input({
      id: 'user-name',
      type: 'text',
      label: 'Nome',
      placeholder: 'Digite o nome completo',
      icon: 'fa-solid fa-user',
      value: this.props.initialData?.name
    });

    const emailInput = new Input({
      id: 'user-email',
      type: 'email',
      label: 'Email',
      placeholder: 'Digite o email',
      icon: 'fa-solid fa-envelope',
      value: this.props.initialData?.email
    });

    const passwordInput = new Input({
      id: 'user-password',
      type: 'password',
      label: isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha',
      placeholder: isEditing ? 'Digite a nova senha (opcional)' : 'Digite a senha',
      icon: 'fa-solid fa-lock'
    });

    const submitButton = new Button({
      text: isEditing ? 'Salvar Alterações' : 'Criar Usuário',
      type: 'submit',
      variant: 'primary',
      fullWidth: true,
      action: 'submit-user'
    });

    const cancelButton = new Button({
      text: 'Cancelar',
      type: 'button',
      variant: 'ghost',
      fullWidth: true,
      action: 'cancel-user'
    });

    return template
      .replace('{{name_input}}', nameInput.render())
      .replace('{{email_input}}', emailInput.render())
      .replace('{{password_input}}', passwordInput.render())
      .replace('{{submit_button}}', submitButton.render())
      .replace('{{cancel_button}}', cancelButton.render());
  }

  public bindEvents(container: HTMLElement): void {
    const form = container.querySelector('[data-form="user-form"]') as HTMLFormElement;
    const cancelBtn = container.querySelector('[data-action="cancel-user"]');
    const roleSelect = container.querySelector('#user-role') as HTMLSelectElement;

    if (!form) return;

    // Preenche o role se estiver editando
    if (this.props.initialData && roleSelect) {
      roleSelect.value = this.props.initialData.role;
    }

    form.addEventListener('submit', (e) => this.handleSubmit(e, form));
    cancelBtn?.addEventListener('click', () => this.props.onCancel());
  }

  private handleSubmit(e: Event, form: HTMLFormElement): void {
    e.preventDefault();

    const nameInput = form.querySelector('#user-name') as HTMLInputElement;
    const emailInput = form.querySelector('#user-email') as HTMLInputElement;
    const passwordInput = form.querySelector('#user-password') as HTMLInputElement;
    const roleSelect = form.querySelector('#user-role') as HTMLSelectElement;

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    const role = roleSelect?.value as 'admin' | 'user';

    this.clearErrors(form);

    if (!this.validateForm(name, email, password, form)) {
      return;
    }

    const user: Partial<User> = {
      name,
      email,
      role
    };

    // Só inclui a senha se foi preenchida
    if (password) {
      (user as any).password = password;
    }

    this.props.onSubmit(user);
  }

  private validateForm(name: string, email: string, password: string, form: HTMLFormElement): boolean {
    let isValid = true;
    const isEditing = !!this.props.initialData;

    if (!name) {
      this.showError(form, 'user-name', 'O nome é obrigatório');
      isValid = false;
    } else if (name.length < 3) {
      this.showError(form, 'user-name', 'O nome deve ter pelo menos 3 caracteres');
      isValid = false;
    }

    if (!email) {
      this.showError(form, 'user-email', 'O email é obrigatório');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showError(form, 'user-email', 'Email inválido');
      isValid = false;
    }

    // Senha é obrigatória apenas na criação
    if (!isEditing && !password) {
      this.showError(form, 'user-password', 'A senha é obrigatória');
      isValid = false;
    } else if (password && password.length < 6) {
      this.showError(form, 'user-password', 'A senha deve ter pelo menos 6 caracteres');
      isValid = false;
    }

    return isValid;
  }

  private showError(form: HTMLElement, fieldId: string, message: string): void {
    const errorElement = form.querySelector(`#error-${fieldId}`);
    const inputElement = form.querySelector(`#${fieldId}`);

    if (errorElement) {
      errorElement.textContent = message;
    }

    if (inputElement) {
      const isSelect = inputElement.tagName === 'SELECT';
      inputElement.classList.add(isSelect ? 'form-select--error' : 'form-input--error');
    }
  }

  private clearErrors(form: HTMLElement): void {
    const errorElements = form.querySelectorAll('.form-error');
    const inputElements = form.querySelectorAll('.form-input, .form-select');

    errorElements.forEach(el => {
      el.textContent = '';
    });

    inputElements.forEach(el => {
      el.classList.remove('form-input--error', 'form-select--error');
    });
  }
}
