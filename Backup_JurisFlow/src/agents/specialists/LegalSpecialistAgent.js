/**
 * JurisFlow AI Agent Engine - LegalSpecialistAgent
 * Exemplo de Agente Especialista Jurídico que combina ferramentas e raciocínio.
 */

import { BaseAgent } from '../core/BaseAgent';
import { CoreTools } from '../tools/ToolRegistry';
import { AgentPrompts } from '../prompts/systemPrompts';
import { AgentMemory } from '../memory/AgentMemory';

export class LegalSpecialistAgent extends BaseAgent {
  constructor() {
    super({
      name: 'LegalSpecialistAgent',
      role: 'Especialista em Análise de Intimações e Prazos Processuais',
      systemPrompt: AgentPrompts.LEGAL_ADVISOR,
      memory: new AgentMemory(15),
      maxIterations: 4
    });

    // Registra ferramentas nativas
    this.registerTool(CoreTools.lookupCNJTool);
    this.registerTool(CoreTools.lookupCNPJTool);
    this.registerTool(CoreTools.analyzePublicationTool);
    this.registerTool(CoreTools.createWhatsAppLinkTool);
  }

  /**
   * Execução da tarefa recebida
   */
  async run(input, context = {}) {
    const { iteration, lastObservation } = context;

    // Se houver texto de publicação e ainda não analisou
    if (iteration === 1 && input.publicationText) {
      return {
        isFinished: false,
        toolCall: {
          name: 'analyze_publication',
          params: { text: input.publicationText }
        }
      };
    }

    // Se obteve o resultado da análise de publicação
    if (lastObservation && lastObservation.success) {
      const data = lastObservation.data;
      const output = `Análise Concluída:\n- Tipo de Ato: ${data.actType}\n- Prazo: ${data.businessDays} dias úteis (Fatal: ${data.deadlineDate})\n- Providência Sugerida: ${data.recommendedAction}\n- Resumo: ${data.summary}`;

      return {
        isFinished: true,
        output
      };
    }

    // Resposta padrão caso receba apenas texto livre
    return {
      isFinished: true,
      output: `Recebido pedido: "${typeof input === 'string' ? input : JSON.stringify(input)}". Agente pronto para processar.`
    };
  }
}
