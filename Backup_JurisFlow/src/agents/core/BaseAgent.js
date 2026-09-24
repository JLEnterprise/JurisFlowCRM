/**
 * JurisFlow AI Agent Engine - BaseAgent
 * Classe base para todos os agentes autônomos do ecossistema JurisFlow.
 */

export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'JurisFlowAgent';
    this.role = config.role || 'Assistente Autônomo';
    this.systemPrompt = config.systemPrompt || '';
    this.tools = new Map();
    this.memory = config.memory || null;
    this.maxIterations = config.maxIterations || 5;
  }

  /**
   * Registra uma ferramenta (tool) que o agente pode utilizar
   */
  registerTool(tool) {
    if (!tool.name || typeof tool.execute !== 'function') {
      throw new Error(`Ferramenta inválida: deve conter 'name' e método 'execute'`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Retorna a lista de ferramentas disponíveis formatadas para a IA
   */
  getAvailableTools() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters || {}
    }));
  }

  /**
   * Método abstrato de execução do agente
   */
  async run(input, context = {}) {
    throw new Error('O método run() deve ser implementado pelo agente especialista.');
  }
}
