export class Validator {
  static isEmpty(value?: string | null): boolean {
    return !value || value.trim().length === 0;
  }

  static hasMinLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static hasMaxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  static isOnlyLetters(value: string): boolean {
    return /^[A-Za-zÀ-ÿ\s]+$/.test(value);
  }

  static isOnlyNumbers(value: string): boolean {
    return /^\d+$/.test(value);
  }

  static isEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static isPasswordStrong(password: string): boolean {
    // - Mínimo 8 caracteres
    // - Pelo menos 1 letra minúscula
    // - Pelo menos 1 letra maiúscula
    // - Pelo menos 1 número
    // - Pelo menos 1 caractere especial (qualquer símbolo)

    // Explicação da Regex:
    // (?=.*[a-z])    -> Garante ter letra minúscula
    // (?=.*[A-Z])    -> Garante ter letra maiúscula
    // (?=.*\d)       -> Garante ter número
    // (?=.*[\W_])    -> Garante ter símbolo (Non-word char) ou underline
    // .{8,}          -> Aceita qualquer coisa com no mínimo 8 chars

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    return regex.test(password);
  }

  static isNameValid(name: string): boolean {
    if (this.isEmpty(name)) return false;

    // Remove espaços extras
    const normalized = name.trim();

    // Pelo menos 4 caracteres (desconsiderando espaços duplicados)
    if (normalized.replace(/\s+/g, '').length < 4) return false;

    // Apenas letras e espaços
    return this.isOnlyLetters(normalized);
  }

  static isValidDate(date: string): boolean {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }

}
