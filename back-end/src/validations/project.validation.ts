export class ProjectValidation {
  static validateName(name: string): boolean {
    return typeof name === 'string' && name.trim().length >= 3;
  }

  static validateDescription(description: string): boolean {
    return typeof description === 'string' && description.trim().length >= 5;
  }

  static validateUserId(userId: number): boolean {
    return typeof userId === 'number' && userId > 0;
  }
}
