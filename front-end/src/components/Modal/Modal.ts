import template from './Modal.html';
import './Modal.css';

export class Modal {
    constructor(
        private id: string, 
        private title: string, 
        private content: string
    ) {}

    render(): string {
        let html = template;
        html = html.replace(/{{id}}/g, this.id);
        html = html.replace(/{{title}}/g, this.title);
        html = html.replace(/{{content}}/g, this.content);
        return html;
    }

    static open(id: string): void {
        document.getElementById(id)?.classList.add('open');
    }

    static close(id: string): void {
        document.getElementById(id)?.classList.remove('open');
    }
}