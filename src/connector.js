const util = require('util')
const path = require('path')
const mime = require('mime-types')
const randomize = require('randomatic')
const request = require('request-promise-native')
const _ = require('lodash')
const debug = require('debug')('botium-connector-botframework')

const SimpleRestContainer = require('botium-core/src/containers/plugins/SimpleRestContainer')

const Capabilities = {
  BOTFRAMEWORK_ENDPOINTURL: 'BOTFRAMEWORK_ENDPOINTURL',
  BOTFRAMEWORK_SERVICEURL: 'BOTFRAMEWORK_SERVICEURL',
  BOTFRAMEWORK_APP_ID: 'BOTFRAMEWORK_APP_ID',
  BOTFRAMEWORK_APP_SECRET: 'BOTFRAMEWORK_APP_SECRET',
  BOTFRAMEWORK_CHANNELID: 'BOTFRAMEWORK_CHANNELID',
  BOTFRAMEWORK_RECIPIENTID: 'BOTFRAMEWORK_RECIPIENTID',
  BOTFRAMEWORK_RECIPIENTNAME: 'BOTFRAMEWORK_RECIPIENTNAME',
  BOTFRAMEWORK_MEMBERID: 'BOTFRAMEWORK_MEMBERID',
  BOTFRAMEWORK_MEMBERNAME: 'BOTFRAMEWORK_MEMBERNAME',
  BOTFRAMEWORK_BUTTON_TYPE: 'BOTFRAMEWORK_BUTTON_TYPE',
  BOTFRAMEWORK_BUTTON_VALUE_FIELD: 'BOTFRAMEWORK_BUTTON_VALUE_FIELD'
}
const Defaults = {
  [Capabilities.BOTFRAMEWORK_CHANNELID]: 'emulator',
  [Capabilities.BOTFRAMEWORK_RECIPIENTNAME]: 'Bot',
  [Capabilities.BOTFRAMEWORK_MEMBERNAME]: 'Botium',
  [Capabilities.BOTFRAMEWORK_BUTTON_TYPE]: 'event',
  [Capabilities.BOTFRAMEWORK_BUTTON_VALUE_FIELD]: 'name'
}

class BotiumConnectorBotFramework {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.delegateContainer = null
    this.delegateCaps = null
    this.recipientId = null
    this.memberId = null
    this.accessToken = null
  }

  Validate () {
    debug('Validate called')

    this.caps = Object.assign({}, Defaults, this.caps)

    if (!this.caps[Capabilities.BOTFRAMEWORK_ENDPOINTURL]) throw new Error('BOTFRAMEWORK_ENDPOINTURL capability required')
    if (!this.caps[Capabilities.BOTFRAMEWORK_SERVICEURL]) throw new Error('BOTFRAMEWORK_SERVICEURL capability required')

    this.recipientId = this.caps[Capabilities.BOTFRAMEWORK_RECIPIENTID] || randomize('0', 10)
    this.memberId = this.caps[Capabilities.BOTFRAMEWORK_MEMBERID] || randomize('0', 10)

    if (!this.delegateContainer) {
      this.delegateCaps = {
        SIMPLEREST_START_URL: this.caps[Capabilities.BOTFRAMEWORK_ENDPOINTURL],
        SIMPLEREST_START_VERB: 'POST',
        SIMPLEREST_START_HEADERS: () => this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
        SIMPLEREST_START_BODY: JSON.stringify({
          type: 'conversationUpdate',
          timestamp: '{{fnc.now_ISO}}',
          channelId: this.caps[Capabilities.BOTFRAMEWORK_CHANNELID],
          serviceUrl: this.caps[Capabilities.BOTFRAMEWORK_SERVICEURL],
          conversation: {
            id: '{{botium.conversationId}}',
            name: '{{fnc.testcasename}}'
          },
          id: '{{fnc.uniqid}}',
          membersAdded: [{
            id: this.memberId,
            name: this.caps[Capabilities.BOTFRAMEWORK_MEMBERNAME],
            role: 'user'
          }],
          membersRemoved: [],
          from: {
            id: this.memberId,
            name: this.caps[Capabilities.BOTFRAMEWORK_MEMBERNAME]
          },
          recipient: {
            id: this.recipientId,
            name: this.caps[Capabilities.BOTFRAMEWORK_RECIPIENTNAME],
            role: 'bot'
          }
        }),
        SIMPLEREST_URL: this.caps[Capabilities.BOTFRAMEWORK_ENDPOINTURL],
        SIMPLEREST_METHOD: 'POST',
        SIMPLEREST_HEADERS_TEMPLATE: () => this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
        SIMPLEREST_BODY_TEMPLATE: {
          type: 'message',
          timestamp: '{{fnc.now_ISO}}',
          channelId: this.caps[Capabilities.BOTFRAMEWORK_CHANNELID],
          serviceUrl: this.caps[Capabilities.BOTFRAMEWORK_SERVICEURL],
          conversation: {
            id: '{{botium.conversationId}}',
            name: '{{fnc.testcasename}}'
          },
          id: '{{botium.stepId}}',
          from: {
            id: this.memberId,
            name: this.caps[Capabilities.BOTFRAMEWORK_MEMBERNAME],
            role: 'user'
          },
          recipient: {
            id: this.recipientId,
            name: this.caps[Capabilities.BOTFRAMEWORK_RECIPIENTNAME],
            role: 'bot'
          },
          text: '{{msg.messageText}}'
        },
        SIMPLEREST_REQUEST_HOOK: ({ requestOptions, msg }) => {
          if (msg.buttons && msg.buttons.length > 0 && (msg.buttons[0].text || msg.buttons[0].payload)) {
            let payload = msg.buttons[0].payload || msg.buttons[0].text
            try {
              payload = JSON.parse(payload)
            } catch (err) {
            }
            requestOptions.body.type = this.caps[Capabilities.BOTFRAMEWORK_BUTTON_TYPE]
            delete requestOptions.body.text
            _.set(requestOptions.body, this.caps[Capabilities.BOTFRAMEWORK_BUTTON_VALUE_FIELD], payload)
          }
          if (msg.forms) {
            requestOptions.body.value = requestOptions.body.value || {}
            msg.forms.forEach(f => {
              _.set(requestOptions.body.value, f.name, f.value)
            })
          }
          if (msg.SET_ACTIVITY_VALUE) {
            _.keys(msg.SET_ACTIVITY_VALUE).forEach(key => {
              _.set(requestOptions.body, key, msg.SET_ACTIVITY_VALUE[key])
            })
          }
          if (msg.media && msg.media.length > 0) {
            requestOptions.body.attachments = msg.media.map(attachment => {
              if (!attachment.buffer) throw new Error(`Media attachment ${attachment.mediaUri} not downloaded`)
              if (!attachment.mimeType) throw new Error(`Media attachment ${attachment.mediaUri} no mime type given`)

              return {
                contentType: attachment.mimeType,
                contentUrl: `data:${attachment.mimeType};base64,${attachment.buffer.toString('base64')}`,
                name: path.basename(attachment.mediaUri)
              }
            })
          }
        },
        SIMPLEREST_RESPONSE_JSONPATH: '$.text',
        SIMPLEREST_RESPONSE_HOOK: ({ botMsg }) => {
          // debug(`Response Body: ${util.inspect(botMsg.sourceData, false, null, true)}`)
          const message = botMsg.sourceData
          if (message.type === 'message') {
            botMsg.messageText = message.text || null

            botMsg.media = botMsg.media || []
            botMsg.buttons = botMsg.buttons || []
            botMsg.cards = botMsg.cards || []
            botMsg.forms = botMsg.forms || []

            const mapButton = (b) => ({
              text: b.title || b.text,
              payload: b.value || b.url || b.data,
              imageUri: b.image || b.iconUrl
            })
            const mapImage = (i) => ({
              mediaUri: i.url,
              mimeType: mime.lookup(i.url) || 'application/unknown',
              altText: i.alt || i.altText
            })
            const mapMedia = (m) => ({
              mediaUri: m.url,
              mimeType: mime.lookup(m.url) || 'application/unknown',
              altText: m.profile
            })
            const mapAdaptiveCardRecursive = (c) => {
              const textBlocks = this._deepFilter(c.body, (t) => t.type, (t) => t.type === 'TextBlock')
              const imageBlocks = this._deepFilter(c.body, (t) => t.type, (t) => t.type === 'Image')
              const buttonBlocks = this._deepFilter(c.body, (t) => t.type, (t) => t.type.startsWith('Action.'))
              const actions = (c.actions || []).concat((buttonBlocks && buttonBlocks.map(mapButton)) || [])
              const subcards = actions.filter(a => (a.type === 'Action.ShowCard' && a.card && a.card.body)).map(a => mapAdaptiveCardRecursive(a.card))
              const inputs = this._deepFilter(c.body, (t) => t.type, (t) => t.type.startsWith('Input.'))
              const forms = []
              for (const input of inputs) {
                forms.push({
                  name: input.id,
                  label: input.label,
                  type: input.type.substring('Input.'.length),
                  options: input.choices
                })
              }
              return {
                text: textBlocks && textBlocks.map(t => t.text),
                image: imageBlocks && imageBlocks.length > 0 && mapImage(imageBlocks[0]),
                buttons: actions.map(mapButton),
                media: imageBlocks && imageBlocks.length > 1 && imageBlocks.slice(1).map(mapImage),
                forms: forms.length ? forms : null,
                cards: subcards.length ? subcards : null,
                sourceData: c
              }
            }
            message.attachments && message.attachments.forEach(a => {
              if (a.contentType === 'application/vnd.microsoft.card.hero') {
                botMsg.cards.push({
                  text: a.content.title || a.content.text,
                  subtext: a.content.subtitle,
                  content: a.content.text,
                  image: a.content.images && a.content.images.length > 0 && mapImage(a.content.images[0]),
                  buttons: a.content.buttons && a.content.buttons.map(mapButton),
                  media: a.content.images && a.content.images.length > 1 && a.content.images.slice(1).map(mapImage),
                  sourceData: a
                })
              } else if (a.contentType === 'application/vnd.microsoft.card.adaptive') {
                // if is send 'card inputs please' instead of 'card inputs' then there is an empty card in attachments
                if (a.content) {
                  botMsg.cards.push(mapAdaptiveCardRecursive(a.content))
                }
              } else if (a.contentType === 'application/vnd.microsoft.card.animation' ||
                a.contentType === 'application/vnd.microsoft.card.audio' ||
                a.contentType === 'application/vnd.microsoft.card.video') {
                botMsg.cards.push({
                  text: a.content.title || a.content.text,
                  subtext: a.content.subtitle,
                  content: a.content.text,
                  image: a.content.image && mapImage(a.content.image),
                  buttons: a.content.buttons && a.content.buttons.map(mapButton),
                  media: a.content.media && a.content.media.map(mapMedia),
                  sourceData: a
                })
              } else if (a.contentType === 'application/vnd.microsoft.card.thumbnail') {
                botMsg.cards.push({
                  text: a.content.title || a.content.text,
                  subtext: a.content.subtitle,
                  content: a.content.text,
                  image: a.content.images && a.content.images.length > 0 && mapImage(a.content.images[0]),
                  buttons: a.content.buttons && a.content.buttons.map(mapButton),
                  media: a.content.images && a.content.images.length > 1 && a.content.images.slice(1).map(mapImage),
                  sourceData: a
                })
              } else if (a.contentType === 'text/markdown') {
                botMsg.cards.push({
                  content: a.content,
                  sourceData: {
                    type: 'AdaptiveCard',
                    body: [
                      {
                        type: 'TextBlock',
                        text: a.content
                      }
                    ]
                  }
                })
              } else if (a.contentType === 'text/plain') {
                botMsg.cards.push({
                  content: a.content
                })
              } else if (a.contentType && a.contentUrl) {
                botMsg.media.push({
                  mediaUri: a.contentUrl,
                  mimeType: a.contentType,
                  altText: a.name
                })
              } else if (a.content && a.content.buttons && a.content.buttons.length > 0) {
                a.content.buttons.forEach(b => {
                  botMsg.buttons.push(mapButton(b))
                })
              }
            })

            message.suggestedActions && message.suggestedActions.actions && message.suggestedActions.actions.forEach(a => {
              botMsg.buttons.push(mapButton(a))
            })

            if (message.entities && message.entities.length > 0) {
              botMsg.entities = message.entities.map(e => ({
                name: e.name,
                value: e.value
              }))
            }

            if (!botMsg.messageText && botMsg.cards) {
              const card = botMsg.cards.find(c => c.text)
              if (card && _.isArray(card.text) && card.text.length > 0) {
                botMsg.messageText = card.text[0]
              } else if (card && _.isString(card.text)) {
                botMsg.messageText = card.text
              }
            }
            if (!botMsg.messageText && botMsg.buttons) {
              const button = botMsg.buttons.find(b => b.text)
              if (button) {
                botMsg.messageText = button.text
              }
            }
          }
        },
        SIMPLEREST_INBOUND_SELECTOR_JSONPATH: '$.body.conversation.id',
        SIMPLEREST_INBOUND_SELECTOR_VALUE: '{{botium.conversationId}}'
      }
      for (const capKey of Object.keys(this.caps).filter(c => c.startsWith('SIMPLEREST'))) {
        if (!this.delegateCaps[capKey]) this.delegateCaps[capKey] = this.caps[capKey]
      }

      debug(`Validate delegateCaps ${util.inspect(this.delegateCaps)}`)
      this.delegateContainer = new SimpleRestContainer({ queueBotSays: this.queueBotSays, caps: this.delegateCaps })
    }

    debug('Validate delegate')
    return this.delegateContainer.Validate()
  }

  async Build () {
    if (this.caps[Capabilities.BOTFRAMEWORK_APP_ID]) {
      try {
        const tokenResponse = await request({
          uri: 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.caps[Capabilities.BOTFRAMEWORK_APP_ID],
            client_secret: this.caps[Capabilities.BOTFRAMEWORK_APP_SECRET],
            scope: `${this.caps[Capabilities.BOTFRAMEWORK_APP_ID]}/.default`
          }).toString()
        })
        this.accessToken = JSON.parse(tokenResponse).access_token
        debug(`Generated bot connector token for app ${this.caps[Capabilities.BOTFRAMEWORK_APP_ID]}`)
      } catch (err) {
        throw new Error(`Failed to generate bot connector token for app ${this.caps[Capabilities.BOTFRAMEWORK_APP_ID]}: ${err.message}`)
      }
    }
    await this.delegateContainer.Build()
  }

  async Start () {
    await this.delegateContainer.Start()
  }

  async UserSays (msg) {
    await this.delegateContainer.UserSays(msg)
  }

  async Stop () {
    await this.delegateContainer.Stop()
  }

  async Clean () {
    await this.delegateContainer.Clean()
  }

  _deepFilter (item, selectFn, filterFn) {
    if (!item) {
      return []
    }
    let result = []
    if (_.isArray(item)) {
      item.filter(selectFn).forEach(subItem => {
        result = result.concat(this._deepFilter(subItem, selectFn, filterFn))
      })
    } else if (selectFn(item)) {
      if (filterFn(item)) {
        result.push(item)
      } else {
        if (!item.type || item.type !== 'Action.ShowCard') {
          Object.getOwnPropertyNames(item).forEach(key => {
            result = result.concat(this._deepFilter(item[key], selectFn, filterFn))
          })
        }
      }
    }
    return result
  }
}

module.exports = BotiumConnectorBotFramework
