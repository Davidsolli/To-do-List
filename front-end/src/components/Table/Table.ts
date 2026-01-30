import template from './Table.html';
import './Table.css';

interface TableProps {
    headers: string[];
    rows: string[];
}

export class Table {
    constructor(private props: TableProps) {}

    render(): string {
        const headerHtml = this.props.headers
            .map(h => `<th>${h}</th>`)
            .join('');
        
        const rowsHtml = this.props.rows.length > 0 
            ? this.props.rows.join('') 
            : `<tr><td colspan="${this.props.headers.length}" class="text-center" style="padding: 2rem; color: var(--text-secondary);">Nenhum registro encontrado.</td></tr>`;

        return template
            .replace('{{headers}}', headerHtml)
            .replace('{{rows}}', rowsHtml);
    }
}