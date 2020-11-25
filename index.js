const BotiumConnectorBotFramework = require('./src/connector')

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorBotFramework,
  PluginDesc: {
    name: 'Bot Framework',
    provider: 'Microsoft',
    features: {
    },
    capabilities: [
      {
        name: 'RASA_ENDPOINT_URL',
        label: 'HTTP(S) endpoint URL of your Rasa chatbot host',
        description: 'URL without endpoint path',
        type: 'url',
        required: true
      },
      {
        name: 'RASA_MODE',
        label: 'Rasa Endpoint',
        description: 'Choose between conversational flow testing or NLU testing',
        type: 'choice',
        required: false,
        choices: [
          { key: 'DIALOG_AND_NLU', name: 'Rasa dialogue and NLU engine' },
          { key: 'REST_INPUT', name: 'Rasa Core (dialogue engine only)' },
          { key: 'NLU_INPUT', name: 'Rasa NLU (NLU engine only)' }
        ]
      },
      {
        name: 'RASA_ENDPOINT_PING_URL',
        label: 'HTTP(S) endpoint to ping before start',
        type: 'url',
        required: false
      },
      {
        name: 'RASA_ENDPOINT_TOKEN',
        label: 'Token for Token Authentication',
        type: 'secret',
        required: false
      },
      {
        name: 'RASA_ENDPOINT_JWT',
        label: 'JWT Token for JWT Authentication',
        type: 'secret',
        required: false
      }
    ]
  }
}
