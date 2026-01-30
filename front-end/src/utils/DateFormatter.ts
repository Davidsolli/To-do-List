/**
 * Utilitário para formatação de datas
 * Cuida da conversão de timestamps e fusos horários
 */

export class DateFormatter {
    /**
     * Formata um timestamp Unix (segundos) para o padrão brasileiro dd/mm/yyyy
     * @param timestamp - Timestamp Unix em segundos
     * @returns Data formatada em dd/mm/yyyy ou 'Sem prazo' se inválido
     */
    static formatDate(timestamp: number | null | undefined): string {
        if (!timestamp) {
            return 'Sem prazo';
        }

        try {
            // Converte timestamp de segundos para milissegundos
            const date = new Date(timestamp * 1000);

            // Verifica se é uma data válida
            if (isNaN(date.getTime())) {
                return 'Sem prazo';
            }

            // Formata usando o fuso horário local do navegador
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Sem prazo';
        }
    }

    /**
     * Formata um timestamp Unix para incluir hora (dd/mm/yyyy HH:mm)
     * @param timestamp - Timestamp Unix em segundos
     * @returns Data e hora formatadas ou 'Sem prazo' se inválido
     */
    static formatDateTime(timestamp: number | null | undefined): string {
        if (!timestamp) {
            return 'Sem prazo';
        }

        try {
            const date = new Date(timestamp * 1000);

            if (isNaN(date.getTime())) {
                return 'Sem prazo';
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error);
            return 'Sem prazo';
        }
    }

    /**
     * Formata uma data relativa (ex: "Hoje", "Amanhã", "Há 2 dias")
     * @param timestamp - Timestamp Unix em segundos
     * @returns String relativa ou data formatada
     */
    static formatRelativeDate(timestamp: number | null | undefined): string {
        if (!timestamp) {
            return 'Sem prazo';
        }

        try {
            const date = new Date(timestamp * 1000);
            const now = new Date();

            if (isNaN(date.getTime())) {
                return 'Sem prazo';
            }

            // Reset hora para comparação de dias
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const diffTime = dateOnly.getTime() - nowOnly.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Amanhã';
            if (diffDays === -1) return 'Ontem';
            if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
            if (diffDays < -1 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;

            // Para datas mais distantes, usa formato padrão
            return this.formatDate(timestamp);
        } catch (error) {
            console.error('Erro ao formatar data relativa:', error);
            return 'Sem prazo';
        }
    }

    /**
     * Converte uma string de data ISO para timestamp Unix
     * @param isoDate - Data no formato ISO (YYYY-MM-DD ou completo)
     * @returns Timestamp Unix em segundos
     */
    static isoToTimestamp(isoDate: string): number {
        const date = new Date(isoDate);
        return Math.floor(date.getTime() / 1000);
    }

    /**
     * Verifica se uma data já passou
     * @param timestamp - Timestamp Unix em segundos
     * @returns true se a data já passou
     */
    static isPast(timestamp: number): boolean {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        return date < now;
    }

    /**
     * Verifica se uma data é hoje
     * @param timestamp - Timestamp Unix em segundos
     * @returns true se a data é hoje
     */
    static isToday(timestamp: number): boolean {
        const date = new Date(timestamp * 1000);
        const now = new Date();

        return (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    }
}
