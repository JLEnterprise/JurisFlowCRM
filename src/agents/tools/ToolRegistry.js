/**
 * JurisFlow AI Agent Engine - ToolRegistry
 * Catálogo e registro de ferramentas nativas que os agentes podem acionar.
 */

import { lookupCNJ, lookupCNPJ, lookupCEP } from '../../services/brasilApiService';
import { generateWhatsAppLink } from '../../services/whatsappService';
import { analyzeLegalPublication, generateLegalDraft } from '../../services/aiService';

export const CoreTools = {
  // Ferramenta de Consulta Processual CNJ / DataJud
  lookupCNJTool: {
    name: 'lookup_cnj',
    description: 'Consulta e decodifica o número CNJ para extrair tribunal, ramo da justiça e comarca.',
    parameters: {
      cnjNumber: { type: 'string', description: 'Número do processo no padrão CNJ (ex: 0001234-56.2024.8.26.0100)' }
    },
    execute: async ({ cnjNumber }) => {
      return lookupCNJ(cnjNumber);
    }
  },

  // Ferramenta de Consulta Cadastral de Empresas (CNPJ)
  lookupCNPJTool: {
    name: 'lookup_cnpj',
    description: 'Consulta dados cadastrais de uma empresa via BrasilAPI (Razão Social, Sócios, Endereço).',
    parameters: {
      cnpj: { type: 'string', description: 'CNPJ da empresa com ou sem formatação' }
    },
    execute: async ({ cnpj }) => {
      return await lookupCNPJ(cnpj);
    }
  },

  // Ferramenta de Análise de Publicação e Cálculo de Prazos
  analyzePublicationTool: {
    name: 'analyze_publication',
    description: 'Analisa o teor de uma intimação judicial, calcula o prazo fatal em dias úteis e sugere providências.',
    parameters: {
      text: { type: 'string', description: 'Texto da publicação do Diário de Justiça' }
    },
    execute: async ({ text }) => {
      return await analyzeLegalPublication(text);
    }
  },

  // Ferramenta de Geração de Notificações / WhatsApp
  createWhatsAppLinkTool: {
    name: 'create_whatsapp_link',
    description: 'Gera link seguro de envio para WhatsApp com texto formatado.',
    parameters: {
      phone: { type: 'string', description: 'Telefone do destinatário' },
      message: { type: 'string', description: 'Texto da mensagem' }
    },
    execute: async ({ phone, message }) => {
      return { url: generateWhatsAppLink(phone, message) };
    }
  }
};
