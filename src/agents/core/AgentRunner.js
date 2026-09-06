/**
 * JurisFlow AI Agent Engine - AgentRunner
 * Orquestrador do loop de raciocínio autônomo (Thought -> Action -> Observation -> Answer).
 */

export class AgentRunner {
  constructor(agent) {
    this.agent = agent;
  }

  /**
   * Executa o ciclo de raciocínio do agente com controle de passos
   */
  async execute(userInput, context = {}) {
    const logs = [];
    let iterations = 0;
    let completed = false;
    let finalAnswer = '';

    logs.push({
      step: 'START',
      message: `Iniciando agente [${this.agent.name}] para a tarefa.`,
      timestamp: new Date().toISOString()
    });

    try {
      while (!completed && iterations < this.agent.maxIterations) {
        iterations++;
        
        // 1. Fase de Pensamento (Thought)
        const thought = `Passo ${iterations}: Analisando contexto e determinando melhor ação.`;
        logs.push({ step: 'THOUGHT', iteration: iterations, message: thought });

        // 2. Executa a lógica do agente especialista
        const result = await this.agent.run(userInput, { ...context, iteration: iterations, logs });

        if (result.isFinished) {
          completed = true;
          finalAnswer = result.output;
          logs.push({ step: 'FINISH', iteration: iterations, output: finalAnswer });
        } else if (result.toolCall) {
          // 3. Execução de Ferramenta (Action)
          const tool = this.agent.tools.get(result.toolCall.name);
          if (tool) {
            logs.push({ step: 'ACTION', tool: tool.name, params: result.toolCall.params });
            const observation = await tool.execute(result.toolCall.params, context);
            logs.push({ step: 'OBSERVATION', tool: tool.name, result: observation });
            // Alimenta a memória/contexto com a observação
            context.lastObservation = observation;
          } else {
            logs.push({ step: 'ERROR', message: `Ferramenta '${result.toolCall.name}' não encontrada.` });
            completed = true;
            finalAnswer = 'Erro: Ferramenta solicitada não está disponível.';
          }
        } else {
          completed = true;
          finalAnswer = result.output || 'Tarefa finalizada com sucesso.';
        }
      }

      if (!completed && iterations >= this.agent.maxIterations) {
        finalAnswer = 'Limite máximo de iterações atingido sem conclusão definitiva.';
        logs.push({ step: 'LIMIT_REACHED', iterations });
      }

      return {
        success: true,
        answer: finalAnswer,
        iterations,
        logs
      };
    } catch (error) {
      console.error('Erro na execução do AgentRunner:', error);
      return {
        success: false,
        error: error.message,
        iterations,
        logs
      };
    }
  }
}
