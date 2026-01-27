export class TaskValidation {
    static validateTitle(title: string): boolean {
        return title.trim().length >= 1;
    }

    static validateDescription(description?: string): boolean {
        if (!description) return true; // opcional
        return description.trim().length >= 0;
    }

    static validatePriority(priority?: string): boolean {
        if (!priority) return true;
        const validPriorities = ['low', 'medium', 'high'];
        return validPriorities.includes(priority.toLowerCase());
    }

    static validateStatus(status?: string): boolean {
        if (!status) return true;
        const validStatuses = ['pending', 'in_progress', 'completed'];
        return validStatuses.includes(status.toLowerCase());
    }

    static validateEstimate(estimate?: number): boolean {
        if (estimate === undefined) return true;
        return estimate >= 0;
    }

    static validateProjectId(projectId: number): boolean {
        return projectId > 0;
    }
}