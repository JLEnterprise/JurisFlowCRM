# 🤖 JurisFlow Agent Engine - Arquitetura de Agentes Autônomos

Bem-vindo ao motor de Agentes Inteligentes do **JurisFlow CRM**. Esta estrutura foi projetada para permitir a criação, teste e orquestração de múltiplos agentes de IA especializados que atuam dentro do escritório de advocacia.

---

## 📁 Estrutura de Diretórios

```
src/agents/
├── core/             # Núcleo: BaseAgent, AgentRunner (Loop Thought-Action-Observation)
├── memory/           # Memória de curto e longo prazo, buffer contextual e estado
├── tools/            # Ferramentas nativas (DataJud, BrasilAPI, WhatsApp, IA, etc.)
├── prompts/          # Personas, System Prompts e diretrizes éticas e jurídicas
├── specialists/      # Agentes especializados (Jurídico, Comercial/SDR, Operacional)
├── workflows/        # Orquestrações de múltiplos agentes em tarefas complexas
└── index.js          # Exportação central de todos os módulos
```

---

## 🚀 Como Criar um Novo Agente do Zero

### 1. Criar a classe herdando de `BaseAgent`
```javascript
import { BaseAgent } from '../core/BaseAgent';
import { CoreTools } from '../tools/ToolRegistry';

export class MeuNovoAgente extends BaseAgent {
  constructor() {
    super({
      name: 'MeuAgente',
      role: 'Função do Agente',
      systemPrompt: 'Instruções de comportamento...',
      maxIterations: 5
    });

    // Registre as ferramentas que o agente pode usar
    this.registerTool(CoreTools.lookupCNJTool);
  }

  async run(input, context) {
    // Lógica de raciocínio do seu agente
    return {
      isFinished: true,
      output: 'Resultado da execução'
    };
  }
}
```

### 2. Executar o Agente com o `AgentRunner`
```javascript
import { AgentRunner } from './core/AgentRunner';
import { MeuNovoAgente } from './specialists/MeuNovoAgente';

const agente = new MeuNovoAgente();
const runner = new AgentRunner(agente);

const resultado = await runner.execute('Minha tarefa ou publicação...');
console.log(resultado.answer);
```
