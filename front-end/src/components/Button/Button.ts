import template from './Button.html';
import './Button.css';

interface ButtonProps {
    text: string;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
    fullWidth?: boolean;
    action?: string; // Para o data-action
    disabled?: boolean;
    loading?: boolean;
    icon?: string; // Classe do FontAwesome (ex: 'fa-solid fa-user')
}

export class Button {
    constructor(private props: ButtonProps) { }

    render(): string {
        const {
            text,
            type = 'button',
            variant = 'primary',
            fullWidth = false,
            action = '',
            disabled = false,
            loading = false,
            icon
        } = this.props;

        const isDisable = disabled || loading;
        const iconHtml = loading
            ? '<i class="fa-solid fa-circle-notch fa-spin"></i>'
            : (icon ? `<i class="${icon}"></i>` : '');

        // Substituição manual dos placeholders do HTML
        return template
            .replace('{{text}}', text)
            .replace('{{type}}', type)
            .replace('{{variantClass}}', `btn--${variant}`)
            .replace('{{widthClass}}', fullWidth ? 'btn--full' : '')
            .replace('{{action}}', action)
            .replace('{{disabledAttribute}}', isDisable ? 'disabled' : '')
            .replace('{{icon}}', iconHtml);
    }
}