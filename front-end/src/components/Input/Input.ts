import template from './Input.html';
import './Input.css';

interface InputProps {
  id: string;
  type: 'text' | 'email' | 'password';
  label?: string; // Agora é opcional
  placeholder?: string;
  value?: string;
  icon?: string; // Classe do FontAwesome (ex: 'fa-solid fa-user')
}

export class Input {
  constructor(private props: InputProps) {}

  render(): string {
    const { 
      id, 
      type, 
      label, 
      placeholder = '', 
      value = '', 
      icon 
    } = this.props;

    // 1. Lógica da Label (Opcional)
    const labelHtml = label 
      ? `<label for="${id}" class="form-label">${label}</label>` 
      : '';

    // 2. Lógica do Ícone Esquerdo (Opcional)
    const iconHtml = icon 
      ? `<i class="${icon} input-icon"></i>` 
      : '';

    // 3. Lógica do Toggle Password (Apenas se type="password")
    // Adicionamos data-toggle-id para saber qual input manipular
    const toggleHtml = type === 'password' 
      ? `<button type="button" class="input-toggle-btn" data-action="toggle-password" data-target="${id}">
           <i class="fa-solid fa-eye"></i>
         </button>`
      : '';

    // 4. Classes de Padding Dinâmico
    const paddingClasses = [
      icon ? 'form-input--has-icon' : '',
      type === 'password' ? 'form-input--has-toggle' : ''
    ].filter(Boolean).join(' ');

    // 5. Substituição
    return template
      .replace('{{label_html}}', labelHtml)
      .replace('{{icon_html}}', iconHtml)
      .replace('{{toggle_html}}', toggleHtml)
      .replace('{{type}}', type)
      .replace(/{{id}}/g, id)
      .replace('{{padding_class}}', paddingClasses) // Injeta as classes de padding
      .replace('{{placeholder}}', placeholder)
      .replace('{{value}}', value);
  }
}