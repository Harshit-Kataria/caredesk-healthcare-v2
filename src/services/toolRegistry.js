const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description: 'Returns appointment totals for the signed-in practice.',
      parameters: {
        type: 'object',
        properties: { scope: { type: 'string', enum: ['current_account'] } },
        required: ['scope'],
        additionalProperties: false
      }
    }
  }
];

async function executeToolCall(toolCall, tools) {
  const handler = tools[toolCall.name];
  if (typeof handler !== 'function') {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }
  return handler(toolCall.arguments);
}

module.exports = { toolDefinitions, executeToolCall };
