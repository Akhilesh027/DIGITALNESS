/**
 * BaseAgent.js
 * Base class for all specialist agents.
 */

const { generateText, generateStructured } = require("../providers/AIProvider");

class BaseAgent {
  constructor(agentName) {
    this.agentName = agentName;
  }

  async run(taskData, context) {
    throw new Error(`Agent '${this.agentName}' must implement the run() method.`);
  }

  async generate(prompt, systemPrompt) {
    return await generateText({ prompt, systemPrompt });
  }

  async generateStructured(prompt, systemPrompt, schemaName) {
    return await generateStructured({ prompt, systemPrompt, schemaName });
  }
}

module.exports = BaseAgent;
