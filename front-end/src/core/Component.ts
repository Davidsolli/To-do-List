export abstract class Component {
  protected container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Elemento container com ID "${containerId}" não encontrado.`);
    }
    this.container = el;
  }

  /**
   * Deve retornar a string do HTML (geralmente importada via html-loader).
   */
  abstract getTemplate(): string;

  /**
   * Renderiza o template no container e executa os hooks de ciclo de vida.
   */
  public render(): void {
    this.container.innerHTML = this.getTemplate();
    this.afterRender();
  }

  /**
   * Hook executado APÓS o HTML ser inserido no DOM.
   * Local ideal para adicionar addEventListener e lógica de interação.
   */
  protected afterRender(): void {}
}