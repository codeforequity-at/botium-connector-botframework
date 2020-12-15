const BotiumConnectorBotFramework = require('./src/connector')

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorBotFramework,
  PluginDesc: {
    name: 'Bot Framework',
    provider: 'Microsoft',
    features: {
      sendAttachments: true
    },
    capabilities: [
      {
        name: 'BOTFRAMEWORK_ENDPOINTURL',
        label: 'Bot Framework Endpoint URL',
        description: 'Bot Framework Endpoint URL, typically ending in "/api/messages"',
        type: 'url',
        required: true
      },
      {
        name: 'BOTFRAMEWORK_SERVICEURL',
        label: 'Inbound Endpoint URL',
        description: 'Inbound Endpoint used as Bot Framework Service URL',
        type: 'inboundurl',
        required: true
      },
      {
        name: 'BOTFRAMEWORK_APP_ID',
        label: 'Microsoft App Id',
        description: 'If your Bot Framework app runs with app id and app secret, Botium will create an authorization token.',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_APP_SECRET',
        label: 'Microsoft App Secret',
        type: 'secret',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_RECIPIENTID',
        label: 'Bot id',
        description: 'If not given a random id will be used',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_RECIPIENTNAME',
        label: 'Bot name',
        description: 'Default "Bot"',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_MEMBERID',
        label: 'Member id used for Botium',
        description: 'If not given a random id will be used',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_MEMBERNAME',
        label: 'Member name used for Botium',
        description: 'Default "Botium"',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_CHANNELID',
        label: 'Bot Framework Channel',
        description: 'Default "emulator"',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_BUTTON_TYPE',
        label: 'Button Activity Type',
        description: 'Default "event"',
        type: 'string',
        required: false
      },
      {
        name: 'BOTFRAMEWORK_BUTTON_VALUE_FIELD',
        label: 'Button Activity Value Field',
        description: 'Default "name"',
        type: 'string',
        required: false
      }
    ]
  }
}
