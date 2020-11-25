# Botium Connector for Bot Framework Endpoints

[![NPM](https://nodei.co/npm/botium-connector-botframework.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-botframework/)

[![Codeship Status for codeforequity-at/botium-connector-botframework](https://app.codeship.com/projects/b026e4e0-f835-4c2f-8905-1e36d8d6e022/status?branch=master)](https://app.codeship.com/projects/419747)
[![npm version](https://badge.fury.io/js/botium-connector-botframework.svg)](https://badge.fury.io/js/botium-connector-botframework)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing your Bot Framework endpoint.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works
Botium connects to your Bot Framework endpoint and receives responses with the _serviceUrl_ property.

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Requirements
* **Node.js and NPM**
* a **Bot Framework endpoint**
* a **project directory** on your workstation to hold test cases and Botium configuration

## Install Botium and Bot Framework Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-botframework
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-botframework
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Connecting Bot Framework to Botium

Create a botium.json with the the URL of your Bot Framework endpoint in your project directory:

```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "<whatever>",
      "CONTAINERMODE": "botframework",
      "BOTFRAMEWORK_ENDPOINTURL": "https://demo.botiumbox.com/mockbot/api/messages",
      "BOTFRAMEWORK_SERVICEURL": "https://xxxxxxxxx.ngrok.io"
    }
  }
}
```

## How to start sample

tbd

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __botframework__ to activate this connector.

### BOTFRAMEWORK_ENDPOINTURL
Bot Framework Endpoint URL, typically ending in _/api/messages_

### BOTFRAMEWORK_SERVICEURL
The URL where the Botium Inbound Url is available, as seen from the Bot Framework app

### BOTFRAMEWORK_APP_ID BOTFRAMEWORK_APP_SECRET
If your Bot Framework app runs with app id and app secret, Botium will create an authorization token.

### BOTFRAMEWORK_CHANNELID
_Default: emulator_

### BOTFRAMEWORK_RECIPIENTID
_Default: generated unique id_

### BOTFRAMEWORK_RECIPIENTNAME
_Default: Bot_

### BOTFRAMEWORK_MEMBERID
_Default: generated unique id_

### BOTFRAMEWORK_MEMBERNAME
_Default: Botium_
