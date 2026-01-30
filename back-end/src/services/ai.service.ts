import Groq from "groq-sdk";

export class AIService {
  private static groq: Groq | null = null;

  private static getGroqClient(): Groq {
    if (!this.groq) {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY não configurada");
      }
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }
    return this.groq;
  }

  static async generateTaskTip(
    title: string,
    description?: string
  ): Promise<string> {
    const groq = this.getGroqClient();

    const prompt = `Você é um assistente especializado em produtividade e gestão de tarefas.

Tarefa: ${title}
${description ? `Descrição: ${description}` : ""}

Gere uma dica curta e prática (máximo 150 caracteres) para ajudar a pessoa a completar esta tarefa com mais eficiência. A dica deve ser:
- Objetiva e acionável
- Em português brasileiro
- Focada em produtividade
- Amigável e motivadora

Responda APENAS com a dica, sem introduções ou explicações adicionais.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 100,
      });

      const tip = completion.choices[0]?.message?.content?.trim();

      if (!tip) {
        throw new Error("Falha ao gerar dica com IA");
      }

      return tip;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao gerar dica: ${error.message}`);
      }
      throw new Error("Erro desconhecido ao gerar dica");
    }
  }
}
