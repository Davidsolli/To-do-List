import template from './Textarea.html';
import './Textarea.css';

interface TextareaProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
}

export class Textarea {
  constructor(private props: TextareaProps) {}

  render(): string {
    const {
      id,
      label,
      placeholder = '',
      value = '',
      rows = 4
    } = this.props;

    const labelHtml = label
      ? `<label for="${id}" class="form-label">${label}</label>`
      : '';

    return template
      .replace('{{label_html}}', labelHtml)
      .replace(/{{id}}/g, id)
      .replace('{{placeholder}}', placeholder)
      .replace('{{value}}', value)
      .replace('{{rows}}', rows.toString());
  }
}
