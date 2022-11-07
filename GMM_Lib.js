/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************

 * Author:                  Robert(Bobby) McGonigle Jr
 *                          Technical Marketing Engineer
 *                          Cisco Systems
 *                          bomcgoni@cisco.com
 * 
 * 
 * Consulting Engineer:     Gerardo Chaves
 *                          Technical Solutions Architect
 *                          Cisco Systems
 * 
 * Special Thanks:          Zacharie Gignac
 *                          Université Laval
 *                          - Contributions made to the 
 *                            original Memory_Functions have 
 *                            been merged in GMM_Lib version 1.7.0
 * 
 * Released: May 16, 2022
 * Updated: September 22, 2022 || 11:58am EST
 * 
 * Version: 1.9.6
*/

import xapi from 'xapi';

export const GMM = {
  Config: {},
  DevConfig: {
    version: '1.9.6'
  },
  DevAssets: {
    queue: [],
    filterAuthRegex: /[\\]*"Auth[\\]*"\s*:\s*[\\]*"([a-zA-Z0-9\/\+\=\_\-]*)\s*[\\]*"/gm,
    memoryConfig: {
      storageMacro: 'Memory_Storage',
      baseMacro: {
        './GMM_Lib_Info': {
          Warning: 'DO NOT MODIFY THIS FILE. It is accessed by multiple macros running on this Room Device',
          Description: {
            1: 'Memory_Functions is a Macro the acts like a simple database, allowing you to read and write data from you current project',
            2: 'Memory_Storage is accessed by either the original Memory_Functions Macro or the GMM_Lib Macro',
            3: 'Memory_Storage deos not need to be activated, and should remain deactivated to limit the # of active macros on your Room Device',
            4: 'To learn how to use either macro, please reference the guides below',
            Guides: { 'Global Macro Messaging': 'https://roomos.cisco.com/macros/Global%20Macro%20Messaging', 'Memory Functions': 'https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage' }
          }
        }
      }
    },
    maxPayloadSize: 1024
  },
  memoryInit: async function () {
    try {
      await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.memoryConfig.storageMacro })
    } catch (e) {
      console.warn({ Message: `Uh-Oh, GMM Memory Storage Macro not found, creating ${GMM.DevAssets.memoryConfig.storageMacro} macro.` })
      await xapi.Command.Macros.Macro.Save({ Name: GMM.DevAssets.memoryConfig.storageMacro }, `var memory = ${JSON.stringify(GMM.DevAssets.memoryConfig.baseMacro, null, 2)}`)
      console.warn({ Message: `${GMM.DevAssets.memoryConfig.storageMacro} macro saved to system, restarting macro runtime...` })
      setTimeout(async function () {
        await xapi.Command.Macros.Runtime.Restart()
      }, 1000)
    }
    return
  },
  read: async function (key) {
    const location = module.require.main.name.replace('./', '')
    var macro = ''
    try {
      macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.memoryConfig.storageMacro, Content: 'True' })
    } catch (e) { }
    return new Promise((resolve, reject) => {
      const raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
      let data = JSON.parse(raw);
      let temp;
      if (data[location] == undefined) {
        data[location] = {};
        temp = data[location];
      } else {
        temp = data[location];
      }
      if (temp[key] != undefined) {
        resolve(temp[key]);
      } else {
        reject(new Error(`Local Read Error. Object: [${key}] was not found in [${GMM.DevAssets.memoryConfig.storageMacro}] for Macro [${location}]`))
      }
    })
  },
  write: async function (key, value) {
    const location = module.require.main.name.replace('./', '')
    var macro = ''
    try {
      macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.memoryConfig.storageMacro, Content: 'True' })
    } catch (e) { };
    return new Promise((resolve) => {
      const raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
      let data = JSON.parse(raw);
      let temp;
      if (data[location] == undefined) {
        data[location] = {};
        temp = data[location];
      } else {
        temp = data[location];
      }
      temp[key] = value;
      data[location] = temp;
      const newStore = JSON.stringify(data, null, 2);
      xapi.Command.Macros.Macro.Save({ Name: GMM.DevAssets.memoryConfig.storageMacro }, `var memory = ${newStore}`).then(() => {
        console.debug(`Local Write Complete => ${location}: {"${key}" : "${value}"}`);
        resolve(value);
      });
    })
  },
  Message: {
    Webex: {
      User: class {
        constructor(CommonBotToken, ...userEmail_Array) {
          this.Params = {
            Url: 'https://webexapis.com/v1/messages',
            Header: ['Content-Type: application/json', 'Authorization: Bearer ' + CommonBotToken,],
            AllowInsecureHTTPS: 'True'
          }
          this.group = userEmail_Array.toString().split(',')
          xapi.Config.HttpClient.Mode.set('On')
          xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')
          console.warn({ '⚠ GMM Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Message.Webex.User class found in the ${module.name.replace('./', '')} macro` })
          console.error({ '⚠ GMM Warning ⚠': `Be sure to securely store your bot token. It is POOR PRACTICE to store any authentication tokens within a Macro` })
        }
        body(message) {
          this.message = `${message}`
          return this
        }
        formattedBody(title = 'Title', subtitle = 'Subtitle', body = 'Message Body', data = '', footer = '') {
          this.message = `- - -\n- - -\n# ${title}\n### ${subtitle}\n **----------------------------------** \n${body}\n${data == '' ? '' : `\`\`\`\n${data}\n\`\`\`\n`}${footer = '' ? '' : `_${footer}_`}\n`
          return this
        }
        async post() {
          const deviceSerial = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
          const name = await xapi.Status.UserInterface.ContactInfo.Name.get()
          const ip = await xapi.Status.Network[1].IPv4.Address.get().catch(async e => {
            console.debug(e)
            const IPv6 = await xapi.Status.Network[1].IPv6.Address.get()
            return IPv6
          })
          var groupError = []
          for (let i = 0; i < this.group.length; i++) {
            try {
              const body = {
                "toPersonEmail": this.group[i],
                "markdown": this.message + `\n **[ Device Info ]** \n DisplayName: ${name}\nSerial: ${deviceSerial}\nAddress: [${ip}](https://${ip}/)\nTimestamp: ${(new Date()).toLocaleString()}\nMacro(App): ${module.require.main.name.replace('./', '')}`
              }
              const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
              console.debug({ Message: `Message sent to [${this.group[i]}] on the Webex App`, Message: this.message, Response: `${request.StatusCode}:${request.status}` })
            } catch (e) {
              e['GMM_Context'] = {
                Destination: this.group[i],
                Message: 'Failed to send message to Webex User',
                PossibleSolution: 'Invite this user to Webex or else this bot can not send messages to this user'
              }
              groupError.push(e)
            }
          }
          if (groupError.length > 0) {
            throw groupError
          }
        }
      },
      Room: class {
        constructor(CommonBotToken, ...roomId_Array) {
          this.Params = {
            Url: 'https://webexapis.com/v1/messages',
            Header: ['Content-Type: application/json', 'Authorization: Bearer ' + CommonBotToken,],
            AllowInsecureHTTPS: 'True'
          }
          this.group = roomId_Array.toString().split(',')
          console.warn({ '⚠ GMM Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Message.Webex.Room class found in the ${module.name.replace('./', '')} macro` })
          console.error({ '⚠ GMM Warning ⚠': `Be sure to securely store your bot token. It is POOR PRACTICE to store any authentication tokens within a Macro` })
        }
        body(message) {
          this.message = `- - -\n# Message:\n${message}`
          return this
        }
        formattedBody(title = 'Title', subtitle = 'Subtitle', body = 'Message Body', data = '', footer = '') {
          this.message = `- - -\n- - -\n# ${title}\n### ${subtitle}\n **----------------------------------** \n${body}\n${data == '' ? '' : `\`\`\`\n${data}\n\`\`\`\n`}${footer = '' ? '' : `_${footer}_`}\n`
          return this
        }
        async post() {
          const deviceSerial = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
          const name = await xapi.Status.UserInterface.ContactInfo.Name.get()
          const ip = await xapi.Status.Network[1].IPv4.Address.get().catch(async e => {
            console.debug(e)
            const IPv6 = await xapi.Status.Network[1].IPv6.Address.get()
            return IPv6
          })
          var groupError = []
          for (let i = 0; i < this.group.length; i++) {
            try {
              const body = {
                "roomId": this.group[i],
                "markdown": this.message + `\n **---------------------------------------** \n **[ Device Info ]-------------------------** \n DisplayName: ${name}\nSerial: ${deviceSerial}\nAddress: [${ip}](https://${ip}/)\nTimestamp: ${(new Date()).toLocaleString()}\nMacro(App): ${module.require.main.name.replace('./', '')}`
              }
              const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
              console.debug({ Message: `Message sent to [${this.group[i]}] on the Webex App`, Message: this.message, Response: `${request.StatusCode}:${request.status}` })
            } catch (e) {
              e['GMM_Context'] = {
                Destination: this.group[i],
                Message: 'Failed to send message to Webex Room',
                PossibleSolution: 'Invite this bot to that Webex Room Destination, or else it can not send messages to the room'
              }
              groupError.push(e)
            }
          }
          if (groupError.length > 0) {
            throw groupError
          }
        }
      }
    }
  },
  Connect: {
    Local: class {
      constructor() {
        this.App = module.require.main.name.replace('./', '')
        this.Payload = { App: this.App, Source: { Type: 'Local', Id: 'localhost' }, Type: '', Value: '' }
        if (GMM.Config?.queueInternvalInMs < 250) { console.warn({ Warning: `${GMM.Config.queueInternvalInMs}ms is below the recommended minimum of 250ms for GMM.Config.queueInternvalInMs` }) };
      }
      status(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .status(message) method. It must contain string or JSON Object Literal`)
        }

        this.Payload['Type'] = 'Status'
        this.Payload['Value'] = message
        return this
      }
      error(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .error(message) method. It must contain string or JSON Object Literal`)
        }

        this.Payload['Type'] = 'Error'
        this.Payload['Value'] = message
        return this
      }
      command(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .command(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Command'
        this.Payload['Value'] = message
        return this
      }
      async queue() {
        GMM.DevAssets.queue.push({ Payload: JSON.parse(JSON.stringify(this.Payload)), Type: 'Local', Id: '_local' })
        console.debug({ Message: `Local Payload queued`, Payload: JSON.stringify(this.Payload) })
      }
      async post() {
        await xapi.Command.Message.Send({ Text: JSON.stringify(this.Payload) })
        console.debug({ Message: `Local [Command] sent from [${this.App}]`, Payload: JSON.stringify(this.Payload) })
      }
    },
    IP: class {
      constructor(CommonUsername = '', CommonPassword = '', ...ipArray) {
        const b64_reg = /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/
        if (CommonUsername == '' && CommonPassword == '') {
          throw new Error('Common Authentication Parameters not found, unable to contruct GMM.Connect.IP class')
        } else if (CommonPassword == '' && b64_reg.test(CommonUsername)) {
          this.Params = {
            Url: ``,
            Header: ['Content-Type: text/xml', `Authorization: Basic ${CommonUsername}`],
            AllowInsecureHTTPS: 'True'
          }
        } else {
          this.Params = {
            Url: ``,
            Header: ['Content-Type: text/xml', `Authorization: Basic ${btoa(CommonUsername + ':' + CommonPassword)}`],
            AllowInsecureHTTPS: 'True'
          }
        }
        if (GMM.Config?.adjustHTTPClientTimeout > 0) {
          if (GMM.Config?.adjustHTTPClientTimeout > 30) {
            console.error({ Message: `GMM.Config.adjustHTTPClientTimeout max timeout is 30 seconds. Defaulting to 30 seconds` })
          } else {
            this.Params['Timeout'] = GMM.Config.adjustHTTPClientTimeout
          }
        }
        this.Payload = { App: module.require.main.name.replace('./', ''), Source: { Type: 'Remote_IP', Id: '' }, Type: '', Value: '' }
        this.group = ipArray.toString().split(',')
        xapi.Config.HttpClient.Mode.set('On')
        xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')
        console.warn({ '⚠ GMM Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Connect.IP class found in the ${module.name.replace('./', '')} macro` })
        console.error({ '⚠ GMM Warning ⚠': `Be sure to securely store your device credentials. It is POOR PRACTICE to store any credentials within a Macro` })
        if (GMM.Config?.queueInternvalInMs < 250) { console.warn({ Warning: `${GMM.Config.queueInternvalInMs}ms is below the recommended minimum of 250ms for GMM.Config.queueInternvalInMs` }) };
      }
      status(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .status(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Status'
        this.Payload.Value = message
        return this
      }
      error(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .error(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Error'
        this.Payload['Value'] = message
        return this
      }
      xapi(shellString) {
        if (!GMM.Config?.AllowXapiCrossTalk) {
          throw new Error('GMM.Config.AllowXapiCrossTalk not configured. Refer to the GMM Doc on RoomOS for more information')
        }
        if (shellString == undefined || shellString == '') {
          throw new Error(`shellString parameter not fullfilled in .xapi(shellString) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'XAPI_PAYLOAD'
        this.Payload['Value'] = shellString
        this.Payload.Source[`IP`] = 'v4'
        this.Payload.Source['Auth'] = this.Params.Header[1].replace('Authorization: Basic ', '')
        return this
      }
      command(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .command(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Command'
        this.Payload['Value'] = message
        return this
      }
      passIP(stack = 'v4') {
        if (stack != 'v4' && stack != 'v6') {
          throw new Error(`[${stack}] is an invalid IPstack. Accepted Values for the method .passIP(stack) are "v4" or "v6"`)
        }
        this.Payload.Source[`IP`] = stack
        return this
      }
      passAuth(username = '', password = '') {
        if (username == '') {
          throw new Error('Username parameter was missing from method: .passAuth(username, password)')
        }
        if (password == '') {
          throw new Error('Password parameter was missing from method: .passAuth(username, password)')
        }
        this.Payload.Source['Auth'] = btoa(`${username}:${password}`)
        console.error({ '⚠ GMM Warning ⚠': `The passAuth() method has been applied to this payload`, Value: this.Payload.Value })
        return this
      }
      async queue(id) {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        if (typeof this.Payload.Source.IP != 'undefined') {
          var temp = JSON.stringify(this.Payload.Source.IP).replace(/"/g, '')
          this.Payload.Source[`IP${this.Payload.Source.IP}`] = await xapi.Status.Network[1][`IP${this.Payload.Source.IP}`].Address.get()
          delete this.Payload.Source.IP
        }
        if (JSON.stringify(this.Payload).length > GMM.DevAssets.maxPayloadSize) {
          console.debug(JSON.stringify(this.Payload))
          throw new Error(`GMM Connect IP ${this.Payload.Type} Message exceeds maximum payload size of ${GMM.DevAssets.maxPayloadSize}. Current payload size: ${JSON.stringify(this.Payload).length}. Check the debug console to identify which message failed.`)
        }
        for (let i = 0; i < this.group.length; i++) {
          this.Params.Url = `https://${this.group[i]}/putxml`
          const body = `<Command><Message><Send><Text>${JSON.stringify(this.Payload)}</Text></Send></Message></Command>`
          GMM.DevAssets.queue.push({ Params: JSON.parse(JSON.stringify(this.Params)), Body: body, Device: this.group[i], Type: 'Remote_IP', Id: `${id}` })
          console.debug({ Message: `Remote_IP message queued for [${this.group[i]}]`, Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`) })
        }
        delete this.Payload.Source[`IP${temp}`]
        delete this.Payload.Source.Auth
      }
      async post(...filter_DeviceIP) {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        if (typeof this.Payload.Source.IP != 'undefined') {
          var temp = JSON.stringify(this.Payload.Source.IP).replace(/"/g, '')
          this.Payload.Source[`IP${this.Payload.Source.IP}`] = await xapi.Status.Network[1][`IP${this.Payload.Source.IP}`].Address.get()
          delete this.Payload.Source.IP
        }
        if (JSON.stringify(this.Payload).length > GMM.DevAssets.maxPayloadSize) {
          console.debug(JSON.stringify(this.Payload))
          throw new Error(`GMM Connect IP ${this.Payload.Type} Message exceeds maximum payload size of ${GMM.DevAssets.maxPayloadSize}. Current payload size: ${JSON.stringify(this.Payload).length}. Check the debug console to identify which message failed.`)
        }
        var groupError = []
        if (filter_DeviceIP == '') {
          for (let i = 0; i < this.group.length; i++) {
            this.Params.Url = `https://${this.group[i]}/putxml`
            const body = `<Command><Message><Send><Text>${JSON.stringify(this.Payload)}</Text></Send></Message></Command>`
            try {
              const request = await xapi.Command.HttpClient.Post(this.Params, body)
              console.debug({ Message: `Remote_IP message sent to [${this.group[i]}]`, Filter: 'False', Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`), Response: `${request.StatusCode}:${request.status}` })
            } catch (e) {
              e['GMM_Context'] = {
                Destination: this.group[i],
                Filter: 'False',
                Message: {
                  Type: this.Payload.Type,
                  Value: this.Payload.Value,
                  Payload: JSON.stringify(body).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`)
                }
              }
              groupError.push(e)
            }
          }
        } else {
          const subGroup = filter_DeviceIP.toString().split(',')
          for (let i = 0; i < subGroup.length; i++) {
            if (this.group.includes(subGroup[i])) {
              this.Params.Url = `https://${subGroup[i]}/putxml`
              const body = `<Command><Message><Send><Text>${JSON.stringify(this.Payload)}</Text></Send></Message></Command>`
              try {
                const request = await xapi.Command.HttpClient.Post(this.Params, body)
                console.debug({ Message: `Remote_IP message sent to [${subGroup[i]}]`, Filter: 'True', Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`), Response: `${request.StatusCode}:${request.status}` })
              } catch (e) {
                e['GMM_Context'] = {
                  Destination: subGroup[i],
                  Filter: 'True',
                  Message: { Type: this.Payload.Type, Value: this.Payload.Value, Payload: JSON.stringify(body).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`) }
                }
                groupError.push(e)
              }
            } else {
              const filterError = { Error: `Device [${subGroup[i]}] not found in device group`, Resolution: `Remove Device [${subGroup[i]}] from your post filter or include Device [${subGroup[i]}] when this class is instantiated` }
              console.warn(filterError)
            }
          }
        }
        delete this.Payload.Source[`IP${temp}`]
        delete this.Payload.Source.Auth
        if (groupError.length > 0) {
          throw groupError
        }
      }
    },
    Webex: class {
      constructor(CommonBotToken, ...deviceIdArray) {
        this.Params = {
          Url: `https://webexapis.com/v1/xapi/command/Message.Send`,
          Header: [`Authorization: Bearer ${CommonBotToken}`, 'Content-Type: application/json'],
          AllowInsecureHTTPS: 'True'
        }
        if (GMM.Config?.adjustHTTPClientTimeout > 0) {
          if (GMM.Config?.adjustHTTPClientTimeout > 30) {
            console.error({ Message: `GMM.Config.adjustHTTPClientTimeout max timeout is 30 seconds. Defaulting to 30 seconds` })
          } else {
            this.Params['Timeout'] = GMM.Config.adjustHTTPClientTimeout
          }
        }
        this.Payload = { App: module.require.main.name.replace('./', ''), Source: { Type: 'Remote_Webex', Id: '' }, Type: '', Value: '' }
        this.group = deviceIdArray.toString().split(',')
        this.Auth = btoa(CommonBotToken)
        xapi.Config.HttpClient.Mode.set('On')
        xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')
        console.warn({ '⚠ GMM Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Connect.Webex class found in the ${module.name.replace('./', '')} macro` })
        console.error({ '⚠ GMM Warning ⚠': `Be sure to securely store your bot token. It is POOR PRACTICE to store any authentication tokens within a Macro` })
        if (GMM.Config?.queueInternvalInMs < 250) { console.warn({ Warning: `${GMM.Config.queueInternvalInMs}ms is below the recommended minimum of 250ms for GMM.Config.queueInternvalInMs` }) };
      }
      status(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .status(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Status'
        this.Payload.Value = message
        return this
      }
      error(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .error(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Error'
        this.Payload['Value'] = message
        return this
      }
      command(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .command(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Command'
        this.Payload['Value'] = message
        return this
      }
      passDeviceId() {
        this.passId = true
        return this
      }
      passToken(newToken = '') {
        if (newToken != '') {
          this.Payload.Source['Auth'] = newToken
        } else {
          this.Payload.Source['Auth'] = atob(this.Auth.toString())
        }
        console.error({ '⚠ GMM Warning ⚠': `The passToken() method has been applied to this payload and will be sent to the following group of devices`, Group: JSON.stringify(this.group), Value: this.Payload.Value, Reminder: 'Be sure to securely store your bot token. It is POOR PRACTICE to store a any authentication tokens within a Macro' })
        return this
      }
      async queue(id) {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        var discoverDeviceId = async function (header, serial) {
          try {
            const url = `https://webexapis.com/v1/devices?serial=${serial}`
            const request = await xapi.Command.HttpClient.Get({
              Url: url,
              Header: header,
              AllowInsecureHTTPS: 'True'
            })
            return JSON.parse(request.Body)
          } catch (e) {
            console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: 'Device ID request failed, returning as [not found]' })
            return { items: [] }
          }
        }
        if (typeof this.passId != 'undefined') {
          var temp = await discoverDeviceId(this.Params.Header, this.Payload.Source.Id)
          this.Payload.Source['DeviceId'] = temp.items == '' ? 'Not Found' : temp.items[0].id
        }
        if (JSON.stringify(this.Payload).length > GMM.DevAssets.maxPayloadSize) {
          console.debug(JSON.stringify(this.Payload))
          throw new Error(`GMM Connect Webex ${this.Payload.Type} Message exceeds maximum payload size of ${GMM.DevAssets.maxPayloadSize}. Current payload size: ${JSON.stringify(this.Payload).length}. Check the debug console to identify which message failed.`)
        }
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        for (let i = 0; i < this.group.length; i++) {
          const body = { deviceId: this.group[i], arguments: { Text: JSON.stringify(this.Payload) } }
          GMM.DevAssets.queue.push({ Params: this.Params, Body: JSON.stringify(body), Device: this.group[i], Type: 'Remote_Webex', Id: `${id}` })
          console.debug({ Message: `Remote_Webex message queued for [${this.group[i]}]`, Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`) })
        }
        delete this.Payload.Source.DeviceId
        delete this.Payload.Source.Auth
      }
      async post(...filter_DeviceID) {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        var discoverDeviceId = async function (header, serial) {
          try {
            const url = `https://webexapis.com/v1/devices?serial=${serial}`
            const request = await xapi.Command.HttpClient.Get({
              Url: url,
              Header: header,
              AllowInsecureHTTPS: 'True'
            })
            return JSON.parse(request.Body)
          } catch (e) {
            console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: 'Device ID request failed, returning as [not found]' })
            return { items: [] }
          }
        }
        if (typeof this.passId != 'undefined') {
          var temp = await discoverDeviceId(this.Params.Header, this.Payload.Source.Id)
          this.Payload.Source['DeviceId'] = temp.items == '' ? 'Not Found' : temp.items[0].id
        }
        if (JSON.stringify(this.Payload).length > GMM.DevAssets.maxPayloadSize) {
          console.debug(JSON.stringify(this.Payload))
          throw new Error(`GMM Connect Webex ${this.Payload.Type} Message exceeds maximum payload size of ${GMM.DevAssets.maxPayloadSize}. Current payload size: ${JSON.stringify(this.Payload).length}. Check the debug console to identify which message failed.`)
        }
        var groupError = []
        if (filter_DeviceID == '') {
          for (let i = 0; i < this.group.length; i++) {
            const body = { deviceId: this.group[i], arguments: { Text: JSON.stringify(this.Payload) } }
            try {
              const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
              console.debug({ Message: `Remote_Webex message sent to [${this.group[i]}]`, Filter: 'False', Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`), Response: `${request.StatusCode}:${request.status}` })
            } catch (e) {
              e['GMM_Context'] = {
                Destination: this.group[i],
                Filter: 'False',
                Message: {
                  Type: this.Payload.Type,
                  Value: this.Payload.Value,
                  Payload: JSON.stringify(body).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`)
                }
              }
              groupError.push(e)
            }
          }
        } else {
          const subGroup = filter_DeviceID.toString().split(',')
          for (let i = 0; i < subGroup.length; i++) {
            if (this.group.includes(subGroup[i])) {
              const body = { deviceId: subGroup[i], arguments: { Text: JSON.stringify(this.Payload) } }
              try {
                const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
                console.debug({ Message: `Remote_Webex message sent to [${subGroup[i]}]`, Filter: 'True', Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`), Response: `${request.StatusCode}:${request.status}` })
              } catch (e) {
                e['GMM_Context'] = {
                  Destination: subGroup[i],
                  Filter: 'True',
                  Message: {
                    Type: this.Payload.Type,
                    Value: this.Payload.Value,
                    Payload: JSON.stringify(body).replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`)
                  }
                }
                groupError.push(e)
              }
            } else {
              const filterError = { Error: `Device [${subGroup[i]}] not found in device group`, Resolution: `Remove Device [${subGroup[i]}] from your post filter or include Device [${subGroup[i]}] when this class is instantiated` }
              console.warn(filterError)
            }
          }
        }
        delete this.Payload.Source.DeviceId
        delete this.Payload.Source.Auth
        if (groupError.length > 0) {
          throw groupError
        }
      }
    }
  },
  Event: {
    Receiver: {
      on: function (callback) {
        xapi.Event.Message.Send.on(event => {
          let response = response = JSON.parse(event.Text)
          if (response.Type == 'XAPI_PAYLOAD') {
            if (GMM.Config?.AllowXapiCrossTalk) {
              //Execute XAPI using Shell - To-Do
              //Callback should be shell response
              console.log(response)
              GMM.shell(response.Value).then(async resp => {
                console.warn(JSON.stringify(resp))
                callback(resp)
                const body = {
                  App: module.require.main.name.replace('./', ''),
                  Source: { Type: 'xApiCrossTalk', IPv4: '', ID: await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get() },
                  Type: 'XAPI_RESPONSE',
                  Value: resp
                }
                await xapi.Command.HttpClient.Post({ Url: `https://${response.Source.IPv4}/putxml`, Header: ['Content-Type: text/xml', `Authorization: Basic ${response.Source.Auth}`], AllowInsecureHTTPS: 'True' }, `<Command><Message><Send><Text>${JSON.stringify(body)}</Text></Send></Message></Command>`)
              })
            } else {
              throw new Error('GMM.Config.AllowXapiCrossTalk not configured. Refer to the GMM Doc on RoomOS for more information')
            }
          } else if (response.Type == 'XAPI_RESPONSE') {
            callback(response)
          } else {
            callback(response)
          }
        })
      },
      once: function (callback) {
        xapi.Event.Message.Send.once(event => {
          callback(JSON.parse(event.Text))
        })
      }
    },
    Schedule: {
      on: function (timeOfDay = '00:00', callBack) {
        //Reference
        //https://github.com/CiscoDevNet/roomdevices-macros-samples/blob/master/Scheduled%20Actions/Scheduler.js
        const [hour, minute] = timeOfDay.replace('.', ':').split(':');
        const now = new Date();
        const parseNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        let difference = parseInt(hour) * 3600 + parseInt(minute) * 60 - parseNow;
        if (difference <= 0) {
          difference += 24 * 3600
        };
        console.debug({ Message: `Scheduled Event subscription set for ${timeOfDay} will fire in ${difference} seconds` })
        return setTimeout(function () {
          const message = { Message: `[${timeOfDay}] Scheduled event fired` }
          callBack(message)
          setTimeout(function () {
            GMM.Event.Schedule.on(timeOfDay, callBack)
          }, 1000)
        }, difference * 1000);
      },
      once: function (timeOfDay = '00:00', callBack) {
        const [hour, minute] = timeOfDay.replace('.', ':').split(':');
        const now = new Date();
        const parseNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        let difference = parseInt(hour) * 3600 + parseInt(minute) * 60 - parseNow;
        if (difference <= 0) {
          difference += 24 * 3600
        };
        console.debug({ Message: `Scheduled Event set for ${timeOfDay} will fire in ${difference} seconds` })
        return setTimeout(function () {
          const message = { Message: `[${timeOfDay}] Scheduled event fired` }
          callBack(message)
        }, difference * 1000);
      }
    },
    Queue: {
      on: async function (callBack) {
        const determineInterval = () => {
          if (GMM.Config?.queueInternvalInMs > 0) {
            return GMM.Config?.queueInternvalInMs
          }; return 250
        }
        const interval = determineInterval()
        const message = {}
        const remainingIds = function () { var pool = []; for (let i = 0; i < GMM.DevAssets.queue.length; i++) { pool.push(GMM.DevAssets.queue[i].Id) }; return pool; }
        if (GMM.DevAssets.queue.length > 0) {
          switch (GMM.DevAssets.queue[0].Type) {
            case 'Local':
              await xapi.Command.Message.Send({ Text: JSON.stringify(GMM.DevAssets.queue[0].Payload) })
              message['Queue_ID'] = GMM.DevAssets.queue[0].Id
              console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed`, Payload: GMM.DevAssets.queue[0].Payload })
              GMM.DevAssets.queue.shift()
              message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Clear' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${interval} ms` }
              callBack(message)
              break;
            case 'Remote_IP':
              try {
                const request_ip = await xapi.Command.HttpClient.Post(GMM.DevAssets.queue[0].Params, GMM.DevAssets.queue[0].Body)
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = request_ip
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`), Response: `${request_ip.StatusCode}:${request_ip.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${interval} ms` }
                callBack(message)
              } catch (e) {
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = e
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`), Response: `${request_ip.StatusCode}:${request_ip.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${interval} ms` }
                callBack(message)
                console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and erred on [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`) })
              }
              break;
            case 'Remote_Webex':
              try {
                const request_webex = await xapi.Command.HttpClient.Post(GMM.DevAssets.queue[0].Params, GMM.DevAssets.queue[0].Body)
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = request_webex
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.filterAuthRegex, `\\"Auth\\":\\"***[HIDDEN]***\\"`), Response: `${request_webex.StatusCode}:${request_webex.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${interval} ms` }
                callBack(message)
              } catch (e) {
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = e
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.filterAuthRegex, `\\"Auth\\":\\"***[HIDDEN]***\\"`), Response: `${request_webex.StatusCode}:${request_webex.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${interval} ms` }
                callBack(message)
                console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and erred on [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.filterAuthRegex, `"Auth":"***[HIDDEN]***"`) })
              }
              break;
            default:
              break;
          }
        } else {
          callBack({ QueueStatus: { RemainingRequests: 'Empty', IdPool: [], CurrentDelay: `${interval} ms` } })
        }
        setTimeout(function () {
          GMM.Event.Queue.on(callBack)
        }, interval)
      }
    }
  }
}


GMM.read.global = async function (key) {
  const location = module.require.main.name.replace('./', '')
  var macro = ''
  try {
    macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.memoryConfig.storageMacro, Content: 'True' })
  } catch (e) { }
  return new Promise((resolve, reject) => {
    let raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
    let data = JSON.parse(raw)
    if (data[key] != undefined) {
      resolve(data[key])
    } else {
      reject(new Error(`Global Read Error. Object: [${key}] was not found in [${GMM.DevAssets.memoryConfig.storageMacro}] for Macro [${location}]`))
    }
  });
}

GMM.read.all = async function () {
  const location = module.require.main.name.replace('./', '')
  var macro = ''
  try {
    macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.memoryConfig.storageMacro, Content: 'True' })
  } catch (e) { }
  return new Promise((resolve, reject) => {
    let raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
    let data = JSON.parse(raw)
    if (data != undefined) {
      resolve(data)
    } else {
      reject(new Error(`All Read Error. Nothing found in [${GMM.DevAssets.memoryConfig.storageMacro}] for Macro [${location}]`))
    }
  });
}

GMM.write.global = async function (key, value) {
  const location = module.require.main.name.replace('./', '')
  var macro = ''
  try {
    macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.memoryConfig.storageMacro, Content: 'True' })
  } catch (e) { }
  return new Promise(resolve => {
    let raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
    let data = JSON.parse(raw);
    data[key] = value;
    let newStore = JSON.stringify(data, null, 4);
    xapi.Command.Macros.Macro.Save({ Name: GMM.DevAssets.memoryConfig.storageMacro }, `var memory = ${newStore}`).then(() => {
      console.debug(`Global Write Complete => ${location}: {"${key}" : "${value}"}`);
      resolve(value);
    });
  });
}

// Shell to JS functions

GMM.shell = async function (data, callback) {
  const filterData = structureXapi(data)
  console.debug(filterData)
  const filterParam = Object.getOwnPropertyNames(filterData.Paramters)
  switch (filterData.Type.toLowerCase()) {
    case 'xcommand': case 'xcom':
      await xapi.Command[filterData.xApi](filterData.Paramters)
      return { Message: `Ok, \`\`\`xCommand ${filterData.xApi.toString().split(',').join(' ')} ${JSON.stringify(filterData.Paramters).replace(/[{}"]/g, '').replace(/,/g, ' ').replace(/:\s*/g, ': ')}\`\`\` complete`, Data: filterData.Paramters };;
    case 'xconfiguration': case 'xconfig':
      switch (filterData.SubType) {
        case 'get':
          const config = await xapi.Config[filterData.xApi][filterParam].get(filterData.Paramters[filterParam])
          return { Data: config };
        case 'set':
          await xapi.Config[filterData.xApi][filterParam].set(filterData.Paramters[filterParam])
          return { Data: filterData.Paramters[filterParam] };
        default:
          break;
      }
      break;
    case 'xstat': case 'xstatus':
      switch (filterData.SubType) {
        case 'get':
          const status = await xapi.Status[filterData.xApi].get()
          return { Data: status };
        default:
          break;
      }
      break;
    case 'xfeedback': case 'xfeed':
      throw new Error('xFeedback not supported by GMM at this time')
      registerFeedback(filterData.xApi, callback) //Stop snooping ;) it kinda works, but more testing is needed :p
    //break;
    default:
      break;
  }
}

function determineType(dt) { //Basically if you have a : colon, you've provided me data, else you're requesting it
  let count = 0
  for (let i = 0; i < dt.length; i++) {
    if (dt[i].includes(':')) {
      count++
    }
  }
  if (count > 0) {
    return 'set'
  } else {
    return 'get'
  }
}

var feedbackRegistrations = {}
function registerFeedback(feedbackString, callback) {
  var path = feedbackString[1].split('/')
  switch (feedbackString[0]) {
    case 'Register':
      console.log({ Message: `Feedback  Registered on ${feedbackString[1]}` })
      path.shift()
      feedbackRegistrations[feedbackString[1]] = xapi.Status[path].on(event => {
        callback(event)
      })
      break;
    case 'Deregister':
      console.log({ Message: `Feedback Deregistered on ${feedbackString[1]}` })
      feedbackRegistrations[feedbackString[1]]()
      break;
  }
}

function structureXapi(arr) {
  var type = arr.split(' ')[0]                          //First item in the string is the type
  var data = arr.split(' ')                             //Then we gather all values for later processing. We split based on the [space]s in the string
  var subType = determineType(data)                     //Checks to see if any values contains a : colon, which indicates a set vs a get
  data.shift()                                          //Remove the type from the data before we filter through it
  var dots = []
  var params = {}
  var paramStartFlag = false                            // False until first parameter pours in
  var paramValueFlag = false                            // False until next parameter shows
  for (let i = 0; i < data.length; i++) {
    if (!paramValueFlag) {
      if (data[i].includes(':')) {                      // ':' all parameters proceed with a colon, use this to determine which is a parameter and which is a value
        paramStartFlag = true;                          // Stays true until done
        paramValueFlag = true;                          // Switch to true to handle value capture logic
        params[data[i].slice(0, -1)] = data[i + 1]      // the value is one position ahead of the parameter
      } else if (paramStartFlag) {
        if ((data[i].includes(':'))) {                  //If we see the next parameter via a colon, we set the value flag back to false
          paramValueFlag = false
        } else {                                        // Else we concatenate the next value, adding back in the space we split out above
          const paramList = Object.getOwnPropertyNames(params)
          const lastParam = paramList[paramList.length - 1]
          params[lastParam] = params[lastParam] + ' ' + data[i]
        }
      }
      else {
        dots.push(data[i])                              // Both flags are false, so we're still gathering the xApi path from the data array
      }
    } else {
      paramValueFlag = false
    }
  }
  const result = { Type: type, SubType: subType, xApi: dots, Paramters: params }
  return result
}

//***********************************************************************

GMM.ReadAuth = async function (classObjectName = '', type = 'IP') {
  if (classObjectName == '') { throw new Error(`Object parameter missing from GMM.ReadAuth`); };
  let vlt = await GMM.read.global(btoa('GMM_Vault')).catch(e => { throw new Error(`Data not found, run GMM.CaptureAuth to populate`) });
  let data;
  return new Promise((resolve, reject) => {
    if (typeof vlt == 'string') {
      vlt = JSON.parse(atob(vlt.split('').reverse().join('')))
      try {
        vlt = JSON.parse(atob(vlt[btoa(classObjectName)].split('').reverse().join('')))
        if (type == 'Webex') {
          data = vlt[btoa('toke')].split('').reverse().join('')
        } else {
          data = btoa(`${atob(vlt[btoa('user')].split('').reverse().join(''))}:${atob(vlt[btoa('pass')].split('').reverse().join(''))}`)
        }
        resolve(data)
      } catch (e) {
        reject(`classObjectName: [${classObjectName}] not found`)
      }
    } else {
      reject(`Auth data not formatted correctly`)
    }
  })
}

GMM.CaptureAuth = async function (classObjectName = '', type = 'IP') {
  if (classObjectName == '') { throw new Error(`Object parameter missing from GMM.CaptureAuth`); };
  await GMM.memoryInit();
  let vlt = await GMM.read.global(btoa('GMM_Vault')).catch(e => { return {} });
  if (typeof vlt == 'string') {
    vlt = JSON.parse(atob(vlt.split('').reverse().join('')))
  }
  const data = { [classObjectName]: {} }
  let passBack = ''

  const initialPrompt = function () {
    xapi.Command.UserInterface.Message.Prompt.Display({
      Title: 'Macro: Authentication Capture',
      Text: `[${module.require.main.name.replace('./', '')}] requires Authentication to other devices outlined in it's scope. Do you want to encode credentials for those devices? NOTE: This is NOT encryption, but is protected by the devices admin login and encoded further.`,
      FeedbackId: `GMM_Service_${GMM.DevConfig.version}_initialPrompt_${classObjectName}`,
      "Option.1": 'Yes, let\'s continue',
      "Option.2": '--------------------',
      "Option.3": 'No, let me review with my team'
    })
  };
  const getUserUI = function () {
    xapi.Command.UserInterface.Message.TextInput.Display({
      Title: 'Enter Device Username',
      Text: `Provide the username for the object ${classObjectName} in order to facilitate inter-codec communication over IP`,
      Duration: 0,
      SubmitText: 'Submit',
      KeyboardState: 'Open',
      InputType: 'SingleLine',
      Placeholder: `Enter Device Username`,
      FeedbackId: `GMM_Service_${GMM.DevConfig.version}_user_${classObjectName}`
    });
  };
  const getPassUI = function () {
    xapi.Command.UserInterface.Message.TextInput.Display({
      Title: 'Enter Device Password',
      Text: `Provide the password for the object ${classObjectName} in order to facilitate inter-codec communication over IP`,
      Duration: 0, SubmitText: 'Submit', KeyboardState: 'Open',
      InputType: 'Password', Placeholder: `Enter Device Password`, FeedbackId: `GMM_Service_${GMM.DevConfig.version}_pass_${classObjectName}`
    });
  };
  const getTokeUI = function () {
    xapi.Command.UserInterface.Message.TextInput.Display({
      Title: 'Enter Bot Token',
      Text: `Provide the bot token for the object ${classObjectName} in order to facilitate inter-codec communication over Webex`,
      Duration: 0, SubmitText: 'Submit', KeyboardState: 'Open',
      InputType: 'SingleLine', Placeholder: `Enter Bot Token`, FeedbackId: `GMM_Service_${GMM.DevConfig.version}_toke_${classObjectName}`
    });
  };

  initialPrompt()

  return new Promise(resolve => {
    var handleCloseTextInput = xapi.Event.UserInterface.Message.TextInput.Clear.on(event => {
      switch (event.FeedbackId) {
        case `GMM_Service_${GMM.DevConfig.version}_user_${classObjectName}`: getUserUI(); break;
        case `GMM_Service_${GMM.DevConfig.version}_pass_${classObjectName}`: getPassUI(); break;
        case `GMM_Service_${GMM.DevConfig.version}_toke_${classObjectName}`: getTokeUI(); break;
      }
    })
    var handleClosePrompt = xapi.Event.UserInterface.Message.Prompt.Cleared.on(event => {
      if (event.FeedbackId == `GMM_Service_${GMM.DevConfig.version}_initialPrompt_${classObjectName}`) {
        console.log(event)
        initialPrompt()
      }
    })
    var wait4prompt = xapi.Event.UserInterface.Message.Prompt.Response.on(async event => {
      if (event.FeedbackId == `GMM_Service_${GMM.DevConfig.version}_initialPrompt_${classObjectName}`) {
        switch (event.OptionId) {
          case 1: case '1':
            switch (type) { case 'IP': getUserUI(); break; case 'Webex': getTokeUI(); break; default: throw new Error(`Unidentified type: ${type} provided for GMM.CaptureAuth`); };
            break;
          case 2: case '2':
            initialPrompt()
            break;
          case 3: case '3':
            await xapi.Command.UserInterface.Message.Prompt.Display({
              Title: 'Disabling Macro',
              Text: `Unable to setup environment for Macro: [${module.require.main.name.replace('./', '')}]. Contact your Device Admin or Integrator to complete this setup.`,
              Duration: 60
            })
            console.error({ Error: 'User opted out of authentication encoding. Please work with the owner of the space to provide authentication for your script', Note: 'Best practice would be to use a 3rd party service to pass authentication to this device, rather than encoding', Action: `${module.require.main.name.replace('./', '')} will disable itself in 3 seconds` })
            setTimeout(async function () {
              await xapi.Command.Macros.Macro.Deactivate({ Name: module.require.main.name.replace('./', '') })
              await xapi.Command.Macros.Runtime.Restart()
            }, 3000)
            break;
        }
      }
    })
    var wait4textInput = xapi.Event.UserInterface.Message.TextInput.Response.on(async event => {
      switch (event.FeedbackId) {
        case `GMM_Service_${GMM.DevConfig.version}_user_${classObjectName}`:
          data[classObjectName][btoa('user')] = (btoa(event.Text)).split('').reverse().join('')
          passBack = event.Text + ':'
          getPassUI()
          break;
        case `GMM_Service_${GMM.DevConfig.version}_pass_${classObjectName}`:
          data[classObjectName][btoa('pass')] = (btoa(event.Text)).split('').reverse().join('')
          data[classObjectName] = (btoa(JSON.stringify(data[classObjectName]))).split('').reverse().join('')
          vlt[btoa(classObjectName)] = data[classObjectName]
          await GMM.write.global(btoa('GMM_Vault'), (btoa(JSON.stringify(vlt))).split('').reverse().join(''))
          wait4textInput(); handleCloseTextInput(); wait4prompt(); handleClosePrompt();
          passBack = passBack + event.Text
          resolve(btoa(passBack))
          break;
        case `GMM_Service_${GMM.DevConfig.version}_toke_${classObjectName}`:
          data[classObjectName][btoa('toke')] = (btoa(event.Text)).split('').reverse().join('')
          data[classObjectName] = (btoa(JSON.stringify(data[classObjectName]))).split('').reverse().join('')
          vlt[btoa(classObjectName)] = data[classObjectName]
          await GMM.write.global(btoa('GMM_Vault'), (btoa(JSON.stringify(vlt))).split('').reverse().join(''))
          wait4textInput(); handleCloseTextInput(); wait4prompt(); handleClosePrompt();
          passBack = event.Text
          resolve(passBack)
          break;
        default:
          break;
      }
    })
  })
}