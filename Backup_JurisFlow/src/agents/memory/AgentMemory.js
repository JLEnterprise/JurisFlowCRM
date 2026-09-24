/**
 * JurisFlow AI Agent Engine - AgentMemory
 * Gerenciador de memória contextual, histórico de ações e estado persistido.
 */

export class AgentMemory {
  constructor(maxHistory = 20) {
    this.history = [];
    this.maxHistory = maxHistory;
    this.state = new Map();
  }

  addMessage(role, content, metadata = {}) {
    this.history.push({
      role,
      content,
      metadata,
      timestamp: new Date().toISOString()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift(); // Remove a mensagem mais antiga para manter o buffer
    }
  }

  getHistory() {
    return [...this.history];
  }

  set(key, value) {
    this.state.set(key, value);
  }

  get(key) {
    return this.state.get(key);
  }

  clear() {
    this.history = [];
    this.state.clear();
  }
}
