import template from './ProjectForm.html';
import './ProjectForm.css';
import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';
import { Button } from '../Button/Button';
import { Project } from '../../models/Project';

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (project: Partial<Project>) => void;
  onCancel: () => void;
}

export class ProjectForm {
  private props: ProjectFormProps;

  constructor(props: ProjectFormProps) {
    this.props = props;
  }

  /**
   * Renderiza o formulário como string HTML
   */
  public render(): string {
    const isEditing = !!this.props.initialData;

    const nameInput = new Input({
      id: 'project-name',
      type: 'text',
      label: 'Nome do Projeto',
      placeholder: 'Digite o nome do projeto',
      icon: 'fa-solid fa-folder',
      value: this.props.initialData?.name
    });

    const descriptionTextarea = new Textarea({
      id: 'project-description',
      label: 'Descrição',
      placeholder: 'Digite uma breve descrição do projeto',
      rows: 4,
      value: this.props.initialData?.description
    });

    const submitButton = new Button({
      text: isEditing ? 'Salvar Alterações' : 'Criar Projeto',
      type: 'submit',
      variant: 'primary',
      fullWidth: true,
      action: 'submit-project'
    });

    const cancelButton = new Button({
      text: 'Cancelar',
      type: 'button',
      variant: 'ghost',
      fullWidth: true,
      action: 'cancel-project'
    });

    return template
      .replace('{{name_input}}', nameInput.render())
      .replace('{{description_input}}', descriptionTextarea.render())
      .replace('{{submit_button}}', submitButton.render())
      .replace('{{cancel_button}}', cancelButton.render());
  }

  /**
   * Vincula os eventos do formulário após ser inserido no DOM
   */
  public bindEvents(container: HTMLElement): void {
    const form = container.querySelector('[data-form="project-form"]') as HTMLFormElement;
    const cancelBtn = container.querySelector('[data-action="cancel-project"]');

    if (!form) return;

    form.addEventListener('submit', (e) => this.handleSubmit(e, form));
    cancelBtn?.addEventListener('click', () => this.props.onCancel());
  }

  /**
   * Processa o envio do formulário
   */
  private handleSubmit(e: Event, form: HTMLFormElement): void {
    e.preventDefault();

    const nameInput = form.querySelector('#project-name') as HTMLInputElement;
    const descriptionTextarea = form.querySelector('#project-description') as HTMLTextAreaElement;

    const name = nameInput?.value.trim();
    const description = descriptionTextarea?.value.trim();

    this.clearErrors(form);

    if (!this.validateForm(name, description, form)) {
      return;
    }

    const project: Partial<Project> = {
      name,
      description
    };

    this.props.onSubmit(project);
  }

  /**
   * Valida os campos do formulário
   */
  private validateForm(name: string, description: string, form: HTMLFormElement): boolean {
    let isValid = true;

    if (!name) {
      this.showError(form, 'project-name', 'O nome do projeto é obrigatório');
      isValid = false;
    } else if (name.length < 3) {
      this.showError(form, 'project-name', 'O nome deve ter pelo menos 3 caracteres');
      isValid = false;
    }

    if (!description) {
      this.showError(form, 'project-description', 'A descrição é obrigatória');
      isValid = false;
    } else if (description.length < 10) {
      this.showError(form, 'project-description', 'A descrição deve ter pelo menos 10 caracteres');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Exibe mensagem de erro para um campo
   */
  private showError(form: HTMLElement, fieldId: string, message: string): void {
    const errorElement = form.querySelector(`#error-${fieldId}`);
    const inputElement = form.querySelector(`#${fieldId}`);

    if (errorElement) {
      errorElement.textContent = message;
    }

    if (inputElement) {
      const isTextarea = inputElement.tagName === 'TEXTAREA';
      inputElement.classList.add(isTextarea ? 'form-textarea--error' : 'form-input--error');
    }
  }

  /**
   * Limpa todas as mensagens de erro
   */
  private clearErrors(form: HTMLElement): void {
    const errorElements = form.querySelectorAll('.form-error');
    const inputElements = form.querySelectorAll('.form-input, .form-textarea');

    errorElements.forEach(el => {
      el.textContent = '';
    });

    inputElements.forEach(el => {
      el.classList.remove('form-input--error', 'form-textarea--error');
    });
  }
}
