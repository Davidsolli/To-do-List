import selectHtml from './Select.html';
import './Select.css';

export interface SelectOption {
    value: string;
    label: string;
    selected?: boolean;
}

export interface SelectConfig {
    name: string;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
}

export class Select {
    private config: SelectConfig;
    private element: HTMLElement | null = null;
    private selectedValue: string = '';
    private isOpen: boolean = false;
    private boundClickOutside: ((e: Event) => void) | null = null;
    private boundEscapeKey: ((e: KeyboardEvent) => void) | null = null;

    constructor(config: SelectConfig) {
        this.config = config;

        // Set initial selected value
        const selectedOption = config.options.find(opt => opt.selected);
        if (selectedOption) {
            this.selectedValue = selectedOption.value;
        }
    }

    render(): string {
        const container = document.createElement('div');
        container.innerHTML = selectHtml;

        const selectEl = container.querySelector('[data-select]') as HTMLElement;

        // Set name attribute
        selectEl.setAttribute('data-name', this.config.name);

        // Set disabled state
        if (this.config.disabled) {
            selectEl.classList.add('disabled');
        }

        // Set initial value
        const valueEl = selectEl.querySelector('[data-value]') as HTMLElement;
        const selectedOption = this.config.options.find(opt => opt.selected);

        if (selectedOption) {
            valueEl.textContent = selectedOption.label;
            valueEl.classList.remove('placeholder');
        } else if (this.config.placeholder) {
            valueEl.textContent = this.config.placeholder;
            valueEl.classList.add('placeholder');
        }

        // Render options
        const optionsContainer = selectEl.querySelector('[data-options]') as HTMLElement;
        optionsContainer.innerHTML = this.config.options.map(option => `
            <div class="select-option ${option.selected ? 'selected' : ''}" 
                 data-value="${option.value}">
                ${option.label}
            </div>
        `).join('');

        return selectEl.outerHTML;
    }

    bindEvents(element: HTMLElement): void {
        this.element = element;

        const trigger = element.querySelector('[data-trigger]') as HTMLElement;
        const options = element.querySelectorAll('.select-option');

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Select option
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = (option as HTMLElement).getAttribute('data-value');
                if (value) {
                    this.selectOption(value);
                }
            });
        });
    }

    destroy(): void {
        this.close();
        this.element = null;
    }

    private toggle(): void {
        if (this.config.disabled) return;

        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        if (!this.element) return;

        this.isOpen = true;
        this.element.classList.add('active');
        
        // Setup click outside handler
        this.boundClickOutside = (e: Event) => {
            const target = e.target as HTMLElement;
            
            if (this.element && !this.element.contains(target)) {
                this.close();
            }
        };
        
        // Setup escape key handler
        this.boundEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        
        // Add listeners with a small delay to prevent immediate trigger
        setTimeout(() => {
            if (this.boundClickOutside) {
                document.addEventListener('click', this.boundClickOutside);
            }
            if (this.boundEscapeKey) {
                document.addEventListener('keydown', this.boundEscapeKey);
            }
        }, 0);
    }

    private close(): void {
        if (!this.element) return;

        this.isOpen = false;
        this.element.classList.remove('active');
        
        // Remove event listeners
        if (this.boundClickOutside) {
            document.removeEventListener('click', this.boundClickOutside);
            this.boundClickOutside = null;
        }
        
        if (this.boundEscapeKey) {
            document.removeEventListener('keydown', this.boundEscapeKey);
            this.boundEscapeKey = null;
        }
    }

    private selectOption(value: string): void {
        if (!this.element) return;

        this.selectedValue = value;

        // Update UI
        const valueEl = this.element.querySelector('[data-value]') as HTMLElement;
        const selectedOption = this.config.options.find(opt => opt.value === value);

        if (selectedOption) {
            valueEl.textContent = selectedOption.label;
            valueEl.classList.remove('placeholder');
        }

        // Update selected state in options
        const options = this.element.querySelectorAll('.select-option');
        options.forEach(option => {
            const optValue = (option as HTMLElement).getAttribute('data-value');
            if (optValue === value) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // Close dropdown
        this.close();

        // Trigger onChange callback
        if (this.config.onChange) {
            this.config.onChange(value);
        }
    }

    getValue(): string {
        return this.selectedValue;
    }

    setValue(value: string): void {
        this.selectOption(value);
    }

    disable(): void {
        this.config.disabled = true;
        if (this.element) {
            this.element.classList.add('disabled');
        }
    }

    enable(): void {
        this.config.disabled = false;
        if (this.element) {
            this.element.classList.remove('disabled');
        }
    }
}
