/**
 * JurisFlow AI Agent Engine - LegalSpecialistAgent
 * Agente Especialista Jurídico & Operacional Integrado ao Motor Cognitivo AdvJuris.
 */

import { BaseAgent } from '../core/BaseAgent';
import { CoreTools } from '../tools/ToolRegistry';
import { AgentPrompts } from '../prompts/systemPrompts';
import { AgentMemory } from '../memory/AgentMemory';
import { generateDeepLegalAnswer } from '../../services/deepLegalEngine';

export class LegalSpecialistAgent extends BaseAgent {
  constructor() {
    super({
      name: 'LegalSpecialistAgent',
      role: 'Especialista em Análise de Intimações, Prazos Processuais e Consultoria Jurídica',
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
    const { iteration, lastObservation, crmContext } = context;

    // Se houver texto de publicação e ainda não analisou
    if (iteration === 1 && input?.publicationText) {
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
      const output = `Análise Concluída:\n- Tipo de Ato: ${data.actType || 'Intimação Judicial'}\n- Prazo: ${data.businessDays || data.days || 15} dias (Fatal: ${data.deadlineDate || 'Ver no CRM'})\n- Providência Sugerida: ${data.recommendedAction || data.action || 'Manifestação tempestiva'}\n- Resumo: ${data.summary || data.text?.slice(0, 200)}`;

      return {
        isFinished: true,
        output
      };
    }

    // Se for pergunta jurídica ou solicitação operacional em texto livre
    const query = typeof input === 'string' ? input : input?.query || JSON.stringify(input);
    const deepAnswer = generateDeepLegalAnswer(query, [], crmContext || {});

    return {
      isFinished: true,
      output: deepAnswer
    };
  }
}
