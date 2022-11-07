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
 * Project Lead:      	Enrico Conedera
 *                    	Senior Technical Marketing Engineer
 *                    	econeder@cisco.com
 *                    	Cisco Systems
 * 
 * Consulting Engineer: John Yost
 *                    	Technical Marketing Engineer
 *                    	johyost@cisco.com
 *                    	Cisco Systems
 * 
 * Macro Author:      	Robert(Bobby) McGonigle Jr
 *                    	Technical Marketing Engineer
 *                    	bomcgoni@cisco.com
 *                    	Cisco Systems
 * 
 * ***********************
 * THIS IS A BETA BUILD< DO NOT RE-DISTROBUTE
 * ***********************
 * 
 * Version: Beta 3-0-6
 * Released: July 24, 2022
 * Last Update: October 21, 2022
 *    
 *    This USB Mode macro requires additional hardware for full operation
 *       Please review the setup documentation before you proceed
 * 
 *    As a macro, the features and functions of USB mode are not supported by Cisco TAC
 * 
 *    Hardware and Software support are provided by their respective manufacturers 
 *      and the service agreements they offer
 *    
 *    Should you need assistance with USB Mode, please reference the documentation 
 *      and connect to our Project USB space on Webex. There are over 1500 Partners, 
 *      Integrators and Customers alike sharing their experience and ideas.
 *        To start chatting with your peers, open this link in a browser and 
 *          join the community
 *          https://eurl.io/#L6Rcn39Rn
 * 
 * Script Dependencies: 
 *    Memory_Storage
 *    - Memory Storage will automatically generate when this script loads
 *    - This script is your endpoint's original configuration, used to restore the endpoint when USB mode is disabled
 * 
 * Special thanks to the following contributors
 *    - Zacharie Gignac from Université
 *        - For his contribution to the Memory Storage functionality
 *    - Jonathan Tamayo from Pwc
 *        - Bug Squasher
 *    - Aaron Wilson from Zoetis
 *        - Bug Squasher
 * 
 ********************************************************/
import xapi from 'xapi';
import { GMM } from './GMM_Lib';

//[ USB Mode Configuration Start ]************************/

//Configuration option(s) below this line apply to all profiles
const check4_New_USBVersion_Notifications = true;                      // Default Value: true; Accepted Values: <true, false>; Checks for new USB Mode Version periodically

const usbWelcomePrompt = true;

const hideCustomPanels_inUSBMode = false;                   // Default Value: false; Accepted Values: <true, false>
const hideCustomPanels_inUSBMode_PanelIds = ['TestPanel_1'];             // Example Format: ["panel_1", "panel_2", "panel_3", "panel_Etc"]

const hideCustomPanels_inWebexMode = false;                 // Default Value: false; Accepted Values: <true, false>
const hideCustomPanels_inWebexMode_PanelIds = [];           // Example Format: ["panel_4", "panel_5", "panel_6"]

const hide_EnableWebexMode_Panel = false;                    // Default Value: false; Accepted Values: <true, false>; Hides Enable Webex Mode Panel
const hide_EnableUSBMode_Panel = false;                      // Default Value: false; Accepted Values: <true, false>; Hides Enable USB Mode Panel

const screenShare_Mode = 'standard';                        // Dictates how the default share screen behavior works
const continuousShare_Mode = false;                         // Determines whether your presentation continues after USB mode is disabled

const disengage_USBMode_onSchedule_Mode = false;            // Set a time to disable USB Mode once per day
const disengage_USBMode_onSchedule_Time = '00:00';          // 24 hour time format; Accepted Values >> '00:00' through '23:59'

const reporting_Mode = false;                               // Reporting will send messages to the Webex app on key errors or when FTS is complete
const reporting_Users = [];                                 // Webex App User emails to send Error Messages Too
const reporting_Rooms = [];                                 // Webex App Space IDs to send Error Messages too
const reporting_Token = '';                                 // Auth token required for Webex Messaging API
// ⚠ NOTE ⚠: Anyone with access to this device has access to this token
// It's recommended you edit this Macro and acquire this token from a secure authority
//   rather than having this token written explicitly in the macro

//Configuration option(s) below this line only apply to all profiles except the [pano] amd [room55] profile
const matrix_Camera_Mode = false;                            // Replaces Selfview mechanic with a Matrix Output to the Capture Card instead. Prevents Desktop from accidentally showing, but is restricted to 1 camera

//Configuration option(s) below this line only apply to [room55] and [plus] profiles
const microphone_Output_Mode = 'line';                      // Choose how microphone audio is sent to capture device // Default Value: 'line'; Accepted Values: <'line', 'hmdi'>

//Configuration option(s) below this line only apply to [pro] and [pano] profiles
const codecPro_DualScreen_Mode = false;                      // Enables dual screen support on Pro Profiles, Overrides screenShare_Mode and continuousShare_Mode
const codecPro_DualScreen_Content_Input_1 = 3;              // First Input Source for Dual Screen mode
const codecPro_DualScreen_Content_Input_2 = 4;              // Second Input Source for Dual Screen Mode
const codecPro_DualScreen_SourceSwap_UI = false;             // Enables a Source Swap for Dual Screen Mode (Allows a user to quickly swap sources instead of configuring computer)

//Configuration option(s) below this line only apply to Sx80, Mx700 and Mx800 codecs
const sx80_Mx700_800_videoOutput_Override = 'Third';        // Allows you to Override the output for the Sx80 Codec

//[ USB Mode Configuration End ]************************

//[ USB Mode Text Localization Start ]************************
//Change the options below to match your language

//USB Mode and Webex Mode Panels Text
const enableUSB_Mode_Panel_Text = 'Enable USB Mode';
const enableWebex_Mode_Panel_Text = 'Enable Webex Mode';
const switching_Panel_Text = 'Switching...';
const sourceSwap_Panel_Text = 'Swap Screens';

//USB Mode Welcome Message Prompt
const usbWelcomePrompt_Title = "USB Passthrough Mode";
const usbWelcomePrompt_Text = "You can use all of your cameras and microphones normally. Be sure to choose USB camera and USB microphone in your conferencing software application. DO NOT ADJUST SELFVIEW.";
const usbWelcomePrompt_Duration = 15; // In Seconds
const usbWelcomePrompt_Dismiss = "Dismiss";

//HDMI Signal Not Found Prompt
const missingSourceText_Title = "No HDMI Input Detected";
const missingSourceText_Text = "Make sure your HDMI Presentation Source and USB Cable are connected to your device before selecting \"Enable USB Mode\"";
const missingSourceText_Duration = 20; // In Seconds

//First Time Setup Alert
const ftsAlert_Setup_Title = '⚠ Setting up USB mode ⚠';
const ftsAlert_Setup_Text = 'First Time setup required, running initial USB mode setup...<p>Please Wait until this prompt clears. Approximate Wait 25-30 seconds';
const ftsAlert_Complete_Title = 'First Time Setup Complete!';
const ftsAlert_Complete_Text = 'Be sure you\'ve connected your USB Capture device and HDMI Presentation source before using USB Mode<p>Enjoy!';

//[ USB Mode Text Localization End ]************************

/*
* DO NOT EDIT BELOW THIS LINE. Unless you need too ¯\_(ツ)_/¯
* ----------------------------------------------------------
* - Changing any values or functions below can disrupt the
*     operation of the USB Mode Macro
* 
* - If you're familiar with JS and the xApi and wish to
*     modify USB mode, feel free; however, USB Mode Version
*     3-0-4 and higher, in combination with the GMM_Lib macro 
*     provides a suite of tools for you to build additional 
*     functionality. This will allow you to develop a 
*     standalone macro to interact with USB mode without needing
*     to alter the base script. This allows for a modular approach
*     to the script design, allowing us to iterate USB Mode more
*     freely and preserving your edits as updates come out
*
* - Should you make changes to the base script, make note of 
*     those changes for troubleshooting purposes
*/

//*****[Various Variables]************************
const version = '3-0-5'

const baseMemoryState = { fts: 'incomplete', state: 'Webex_Mode' }; const system = {}

const InterMacro_Message = new GMM.Connect.Local(); let report = {}

let isFTScomplete = 'complete'; let status;

let lastKnownMain; let schedule; let psuedoConfig;

let activeSource = 0;
let USB_Mode_Uptime = 0;
let USB_Mode_UptimeHandler;
let dualScreenSignalHandler;

const panelIds = {
  projectUSB_NotReady: 'projectUSB_NotReady',
  projectUSB_Enable_WebexMode: 'projectUSB_Enable_WebexMode',
  projectUSB_Enable_USBMode: 'projectUSB_Enable_USBMode',
  projectUSB_DualPro_SwapSources: 'projectUSB_DualPro_SwapSources'
}

//*****[Macro Initialization]************************

//Startup script used in USB mode
//Checks to see if FTS has run, generates Memory_Storage Macro
//Enforces minimum OS version, as well as necessary system configurations
//Recovers last known system state in case of unexpected boot or runtime crash
async function init() {
  if (check4_New_USBVersion_Notifications.toString() == 'true' ? true : false) {
    await check4_New_USB_Mode_Version()
  }

  console.warn({ Message: `Initializing ${module.name.replace('./', '')} macro...` })

  psuedoConfig = cloneConfig()

  const checkOs4_minumum_os_compatabilty = check4_Minimum_Version_Required('9.15.0.0')
  const checkOs4_microphone_Output_Mode_compatability = check4_Minimum_Version_Required('10.17.1.0')

  await GMM.memoryInit()
  status = await GMM.read('status').catch(e => { console.debug(e); GMM.write('status', baseMemoryState); return baseMemoryState })
  const config = await GMM.read('config').catch(e => { console.debug(e); GMM.write('config', {}); return {} })

  const activePresentationSource = await xapi.Status.Conference.Presentation.LocalInstance.get()

  system.profile = await check4_System_Compatibility()

  console.log({ Message: `Cisco ${system.codec} found; assigning this CODEC the [${system.profile}] profile...` })

  if (!checkOs4_minumum_os_compatabilty) {
    await error.disableUSBModeMacro(`Minimum RoomOs not met for ${module.name.replace('./', '')}`, `${module.name.replace('./', '')} requires a minimum OS of RoomOs/Ce 9.15.0.0 or higher to function. Upgrade your system to the next stable release of RoomOs`)
  }
  if (!checkOs4_microphone_Output_Mode_compatability && psuedoConfig.microphone_Output_Mode.toLowerCase() == 'hdmi' ? true : false) {
    await error.disableUSBModeMacro('Minimum RoomOs not met for microphone_Output_Mode', `microphone_Output_Mode requires the system to running a minimum of RoomOs 10.15.3.0. Upgrade your system to RoomOs10.15.3.0 or set microphone_Output_Mode to false.`)
  }
  if (system.profile == 'pro' || system.profile == 'pano') {
    await check4_Ce_Console()
  }
  if (system.profile == 'room55' && psuedoConfig.matrix_Camera_Mode.toString() == 'true' ? true : false) {
    error.report('matrix_Camera_Mode not supported on room55 profile', 'Devices with the room55 profile lack the xApi for Video Matrices. Please set matrix_Camera_Mode to false on your Cisco undefined', 'Reverting to normal Selfview method for camera capture')
  }

  await setupReporting()

  lastKnownMain = await xapi.Status.Video.Input.MainVideoSource.get()

  if (lastKnownMain == 'Composed') { lastKnownMain = await xapi.Config.Video.DefaultMainSource.get() }

  try {
    await check4_Video_Monitor_Config()
  } catch (e) {
    return error.disableUSBModeMacro('Video Monitors Auto not allowed - Init', 'The configuration "Video Monitors Auto" is not allowed because USB Passthrough will not work correctly. Follow the step-by-step instructions for configuring your codec web interface with manual monitor values and try again.')
  }

  if (status.fts == 'complete') {
    isFTScomplete = true
    console.log({ Message: `First Time Setup already performed, recovering ${module.name.replace('./', '')} last known state...` })

    await check4_Script_State(status.state)

    if (activePresentationSource != '') { activeSource = activePresentationSource[0].Source }

    Object.freeze(system)

    if (psuedoConfig.disengage_USBMode_onSchedule_Mode.toString() == 'true' ? true : false) {
      schedule = GMM.Event.Schedule.on(psuedoConfig.disengage_USBMode_onSchedule_Time, event => { console.log(event), load.Webex_Mode(`USB Mode Scheduled to disengage at ${psuedoConfig.disengage_USBMode_onSchedule_Time}`) })
    }

    InterMacro_Message.status('Initialized').post()
    sendReport(`${module.name.replace('./', '')} macro fully initialized and ready for use.`, 'Notification - Macro Initialized')
    console.warn({ Message: `${module.name.replace('./', '')} macro fully initialized and ready for use. Enjoy!` })
  } else {
    isFTScomplete = false
    InterMacro_Message.status('RunningFirstTimeSetup').post()
    console.log({ Message: `First Time Setup(FTS) is incomplete, initiating FTS for Cisco ${system.codec}` })
    await FTS()
  }
}

init()

//*****[Subscriptions Start]************************

//Listens for Incoming command sent by other devices/macros using the GMM_Library
//GMM Receiver is based on xEvent Message Send
GMM.Event.Receiver.on(event => {
  if (event.hasOwnProperty('App')) {
    if (event.App != module.name.replace('./', '')) {
      switch (event.Type) {
        case 'Command':
          if (typeof event.Value == 'object') {
            if (event.Value?.EditMatrixOutput) {
              if (psuedoConfig.matrix_Camera_Mode.toString() == 'true' ? true : false) {
                lastKnownMain = event.Value.EditMatrixOutput.sources
                updateMatrixModeSelfview(true, event.Value.EditMatrixOutput.sources)
              }
            }
            if (event.Value?.AlterUSBConfig) {
              switch (event.Value.AlterUSBConfig.config) {
                case 'hideCustomPanels_inUSBMode_PanelIds': case 'hideCustomPanels_inWebexMode_PanelIds': case 'reporting_Users': case 'reporting_Rooms':
                  const prevVal = psuedoConfig[event.Value.AlterUSBConfig.config].clone()
                  event.Value.AlterUSBConfig.value.forEach(element => {
                    psuedoConfig[event.Value.AlterUSBConfig.config].push(element)
                  })
                  console.warn({ Message: `Configuration change issued by [${event.App}]`, Config: event.Value.AlterUSBConfig.config, PreviousValue: prevVal, NewValue: psuedoConfig[event.Value.AlterUSBConfig.config] })
                  break;
                default:
                  console.warn({ Message: `Configuration change issued by [${event.App}]`, Config: event.Value.AlterUSBConfig.config, PreviousValue: psuedoConfig[event.Value.AlterUSBConfig.config], NewValue: event.Value.AlterUSBConfig.value })
                  psuedoConfig[event.Value.AlterUSBConfig.config] = event.Value.AlterUSBConfig.value
                  break;
              }
            }
          } else if (typeof event.Value == 'string') {
            switch (event.Value) {
              case 'EnableUSBMode':
                load.USB_Mode(`Command received by GMM service. Details => ${JSON.stringify(event)}`);
                break;
              case 'EnableWebexMode':
                load.Webex_Mode(`Command received by GMM service. Details => ${JSON.stringify(event)}`);
                break;
              case 'EnableUSBMode_Override':
                load.USB_Mode(`Command received by GMM service. Details => ${JSON.stringify(event)}`, true);
                break;
              case 'EnableWebexMode_Override':
                load.Webex_Mode(`Command received by GMM service. Details => ${JSON.stringify(event)}`, true);
                break;
              default:
                break;
            }
          }
          break;
        case 'Status':
          switch (event.Value) {
            case 'get_USBModeConfig':
              InterMacro_Message.status({ USBModeConfig: psuedoConfig }).post()
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    }
  }
})

//Once per day, midnight local time, check to see if a new USB mode version exists
if (check4_New_USBVersion_Notifications.toString() == 'true' ? true : false) {
  GMM.Event.Schedule.on('00:00', () => {
    check4_New_USB_Mode_Version()
  })
}

//Listens for changes on the Video Monitors config
//Disables USB mode if this is switched back to Auto as it's not supported
xapi.Config.Video.Monitors.on(event => {
  if (event == 'Auto') {
    error.disableUSBModeMacro('Video Monitors Auto not allowed - Config Change', 'The configuration "Video Monitors Auto" is not allowed because USB Passthrough will not work correctly. Follow the step-by-step instructions for configuring your codec web interface with manual monitor values and try again.')
  }
})

//Listen to local Presentation Start, used to track active presentation for screenShare_Mode - 'auto'
xapi.Event.PresentationPreviewStarted.on(event => {
  activeSource = event.LocalSource
  let report = { Message: "Local presentation started", Source: event.LocalSource }
  console.debug(report)
})

//Listen to local Presentation Stop, used to track active presentation for screenShare_Mode - 'auto'
//Provides some logic to handle no signal messaging
xapi.Event.PresentationPreviewStopped.on(event => {
  if (event.Cause == 'noSignal' || event.Cause == 'userRequested') {
    if (isFTScomplete) {
      activeSource = 0
      noSignalDisconnectUSBmode()
    } else {
    }
  } else {
    clearInterval(USB_Mode_UptimeHandler);
    USB_Mode_Uptime = 0;
  }
})

//Listen to Panel Click Events for USB Mode Panels
xapi.Event.UserInterface.Extensions.Panel.Clicked.on(event => {
  switch (event.PanelId) {
    case panelIds.projectUSB_Enable_USBMode:
      load.USB_Mode(`PanelId: ${event.PanelId} Clicked`);
      break;
    case panelIds.projectUSB_Enable_WebexMode:
      clearInterval(USB_Mode_UptimeHandler);
      USB_Mode_Uptime = 0
      load.Webex_Mode(`PanelId: ${event.PanelId} Clicked`);
      break;
    case panelIds.projectUSB_DualPro_SwapSources:
      swapSources()
      break;
    default:
      break;
  }
})

//Listen to Standby State of the device and load Webex Mode if entering standby
xapi.Status.Standby.State.on(event => {
  switch (event) {
    case 'Standby':
      load.Webex_Mode(`Cisco ${system.codec} entered Standby`)
      break;
    case 'Halfwake':
      load.Webex_Mode(`Cisco ${system.codec} entered Halfwake`)
      break;
    default:
      break;
  }
})

//Listens for changes to the Main Source while USB Mode is active
//Allows us to switch Main Sources with matrixCamera_Mode set to true
xapi.Status.Video.Input.MainVideoSource.on(event => {
  if (psuedoConfig.matrix_Camera_Mode.toString() == 'true' ? true : false) {
    if (status.state == 'USB_Mode' || status.state == 'Entering_USB_Mode') {
      updateMatrixModeSelfview(true, event)
    }
  }
});

//*****[Subscriptions End]************************

//*****[Functions Start]************************

//*****[Generic Functions]************************

//Used to create a delay in milliseconds
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

//Used to track how long USB Mode has be active
function increment_USB_Mode_Uptime() {
  USB_Mode_Uptime++
}

//Used to clone objects
Object.prototype.clone = Array.prototype.clone = function () {
  if (Object.prototype.toString.call(this) === '[object Array]') {
    var clone = [];
    for (var i = 0; i < this.length; i++) {
      clone[i] = this[i].clone();
    }
    return clone;
  } else if (typeof (this) == "object") {
    var clone = {};
    for (var prop in this)
      if (this.hasOwnProperty(prop)) {
        clone[prop] = this[prop].clone();
      }
    return clone;
  }
  else {
    return this;
  }
}

function cloneConfig() {
  let cloneConfig = {
    check4_New_USBVersion_Notifications: check4_New_USBVersion_Notifications.clone(),
    usbWelcomePrompt: usbWelcomePrompt.clone(),
    hideCustomPanels_inUSBMode: hideCustomPanels_inUSBMode.clone(),
    hideCustomPanels_inUSBMode_PanelIds: hideCustomPanels_inUSBMode_PanelIds.clone(),
    hideCustomPanels_inWebexMode: hideCustomPanels_inWebexMode.clone(),
    hideCustomPanels_inWebexMode_PanelIds: hideCustomPanels_inWebexMode_PanelIds.clone(),
    hide_EnableWebexMode_Panel: hide_EnableWebexMode_Panel.clone(),
    hide_EnableUSBMode_Panel: hide_EnableUSBMode_Panel.clone(),
    screenShare_Mode: screenShare_Mode.clone(),
    continuousShare_Mode: continuousShare_Mode.clone(),
    disengage_USBMode_onSchedule_Mode: disengage_USBMode_onSchedule_Mode.clone(),
    disengage_USBMode_onSchedule_Time: disengage_USBMode_onSchedule_Time.clone(),
    reporting_Mode: reporting_Mode.clone(),
    reporting_Users: reporting_Users.clone(),
    reporting_Rooms: reporting_Rooms.clone(),
    reporting_Token: reporting_Token.clone(),
    matrix_Camera_Mode: matrix_Camera_Mode.clone(),
    microphone_Output_Mode: microphone_Output_Mode.clone(),
    codecPro_DualScreen_Mode: codecPro_DualScreen_Mode.clone(),
    codecPro_DualScreen_Content_Input_1: codecPro_DualScreen_Content_Input_1.clone(),
    codecPro_DualScreen_Content_Input_2: codecPro_DualScreen_Content_Input_2.clone(),
    codecPro_DualScreen_SourceSwap_UI: codecPro_DualScreen_SourceSwap_UI.clone(),
    sx80_Mx700_800_videoOutput_Override: sx80_Mx700_800_videoOutput_Override.clone(),
  }
  return cloneConfig
}

//*****[USB/Webex Mode Configuration Functions]************************

//Load contains the configuration for both USB Mode and Webex Mode
const load = {
  /*
  Enables Webex_Mode, which is the standard operation of the CODEC
  */
  Webex_Mode: async function (cause = 'No Cause Provided', override = false) {
    if ((status.state != 'Webex_Mode' && status.state != 'Entering_Webex_Mode') || override) {
      status = { fts: 'complete', state: 'Entering_Webex_Mode' }
      clearInterval(dualScreenSignalHandler)
      setTransitionUI()
      InterMacro_Message.status('EnteringWebexMode').post()
      console.warn({ Message: 'EnteringWebexMode', Cause: cause, Override: override })
      const config = await GMM.read('config')
      //Set System Specific Configuration Settings
      switch (system.profile) {
        case 'room55':
          if (psuedoConfig.microphone_Output_Mode.toLowerCase() == 'hdmi') {
            await xapi.Command.Audio.Microphones.Passthrough.Stop({ ConnectorID: 2, ConnectorType: "HDMI" })
          } else {
            await xapi.Config.Audio.Output.Line[1].Mode.set(config.Audio_Output_Line_1.Mode)
            await xapi.Config.Audio.Output.Line[1].OutputType.set(config.Audio_Output_Line_1.OutputType)
          }
          break;
        case 'plus':
          if (psuedoConfig.microphone_Output_Mode.toLowerCase() == 'hdmi') {
            await xapi.Command.Audio.Microphones.Passthrough.Stop({ ConnectorID: 2, ConnectorType: "HDMI" })
          } else {
            await xapi.Config.Audio.Output.Line[1].Mode.set(config.Audio_Output_Line_1.Mode)
            await xapi.Config.Audio.Output.Line[1].OutputType.set(config.Audio_Output_Line_1.OutputType)
          }
          await xapi.Config.Audio.Microphones.AGC.set(config.Audio_Microphones_AGC)
          await xapi.Config.Video.Output.Connector[1].MonitorRole.set(config.Video_Output_Connector_1_MonitorRole)
          break;
        case 'pro': case 'pano':
          await xapi.Config.Video.Output.Connector[1].MonitorRole.set(config.Video_Output_Connector_1_MonitorRole)
          await xapi.Config.Video.Output.Connector[3].MonitorRole.set(config.Video_Output_Connector_3_MonitorRole)
          break;
        default:
          break;
      }

      if (psuedoConfig.continuousShare_Mode.toString() == 'false' ? true : false) {
        await xapi.Command.Presentation.Stop();
      }
      if (psuedoConfig.codecPro_DualScreen_Mode.toString() == 'true' ? true : false) {
        await xapi.Command.Video.Matrix.Reset({ Output: 1 });
        await xapi.Command.Video.Matrix.Reset({ Output: 2 });
      }

      //Set Uiversal Configuration Settings 
      await xapi.Config.Video.Monitors.set(config.Video_Monitors)
      await xapi.Config.Video.Output.Connector[2].MonitorRole.set(config.Video_Output_Connector_2_MonitorRole)

      //Run Commands
      await xapi.Command.Conference.DoNotDisturb.Deactivate()
      await xapi.Command.Audio.VuMeter.Stop({ ConnectorId: 2, ConnectorType: 'Microphone' })
      const qm = { VuMeterAltered: { State: 'Stop', ConnectorId: 2, ConnectorType: 'Microphone' } }
      InterMacro_Message.status(qm).post()

      //Set Selfview
      await delay(500)
      if (system.profile == 'pano') {
        await panoramaSelfView(false)
      } else if (psuedoConfig.matrix_Camera_Mode.toString() == 'true' ? true : false) {
        await updateMatrixModeSelfview(false, lastKnownMain)
      } else {
        await xapi.Command.Video.Selfview.Set({
          FullscreenMode: config.Video_Selfview.FullscreenMode, Mode: config.Video_Selfview.Mode, OnMonitorRole: config.Video_Selfview.OnMonitorRole, PIPPosition: config.Video_Selfview.PIPPosition
        });
      }
      await swapUIto('Webex_Mode')
      status = { fts: 'complete', state: 'Webex_Mode' }
      await GMM.write('status', status)
      InterMacro_Message.status('WebexModeStarted').post()
      console.log({ Message: 'WebexModeStarted' })
    } else {
      console.warn({ Message: `EnteringWebexMode :: Webex Mode already active on ${system.codec}, no action necessary`, Cause: cause })
    }
  },
  /*
  Enables USB_Mode, which is the configuration needed to run Audio and Video appropriately
    to a compatible USB Capture Card
  */
  USB_Mode: async function (cause = 'No Cause Provided', override = false) {
    if ((status.state != 'USB_Mode' && status.state != 'EnteringUSBMode') || override) {
      status = { fts: 'complete', state: 'EnteringUSBMode' }
      if (psuedoConfig.usbWelcomePrompt.toString() == 'true' ? true : false && !override) {
        xapi.Command.UserInterface.Message.Prompt.Display({ Title: usbWelcomePrompt_Title, Text: usbWelcomePrompt_Text, Duration: usbWelcomePrompt_Duration, "Option.1": usbWelcomePrompt_Dismiss })
      }
      setTransitionUI()
      InterMacro_Message.status('EnteringUSBMode').post()
      console.warn({ Message: 'EnteringUSBMode', Cause: cause, Override: override })
      await saveWebexConfig()
      //const config = await GMM.read('config')
      //Set System Specific Configuration Settings
      switch (system.profile) {
        case 'room55':
          await xapi.Config.Video.Monitors.set('Dual')
          if (psuedoConfig.microphone_Output_Mode.toLowerCase() == 'hdmi') {
            await xapi.Command.Audio.Microphones.Passthrough.Start({ ConnectorID: 2, ConnectorType: "HDMI" })
          } else {
            await xapi.Config.Audio.Output.Line[1].Mode.set('On')
            await xapi.Config.Audio.Output.Line[1].OutputType.set('Microphone')
          }
          break;
        case 'plus':
          await xapi.Config.Video.Monitors.set('Dual')
          if (psuedoConfig.microphone_Output_Mode.toLowerCase() == 'hdmi') {
            await xapi.Command.Audio.Microphones.Passthrough.Start({ ConnectorID: 2, ConnectorType: "HDMI" })
          } else {
            await xapi.Config.Audio.Output.Line[1].Mode.set('On')
            await xapi.Config.Audio.Output.Line[1].OutputType.set('Microphone')
          }
          await xapi.Config.Audio.Microphones.AGC.set('Off')
          await xapi.Config.Video.Output.Connector[1].MonitorRole.set('First')
          break;
        case 'pro': case 'pano':
          await xapi.Config.Video.Monitors.set('Triple').catch(async e => { console.debug(e); await xapi.Config.Video.Monitors.set('TriplePresentationOnly'); })
          await xapi.Config.Video.Output.Connector[1].MonitorRole.set('First')
          await xapi.Config.Video.Output.Connector[3].MonitorRole.set('Third')
          break;
        default:
          break;
      }

      if (psuedoConfig.matrix_Camera_Mode.toString() == 'true' ? true : false) {
        updateMatrixModeSelfview(true, lastKnownMain)
      }

      //Set Uiversal Configuration Settings 
      await shareScreen()
      USB_Mode_UptimeHandler = setInterval(increment_USB_Mode_Uptime, 1000)
      await xapi.Config.Video.Output.Connector[2].MonitorRole.set('Second')

      //Run Commands
      await xapi.Command.Conference.DoNotDisturb.Activate({ Timeout: '1440' })
      await xapi.Command.Audio.VuMeter.Start({ ConnectorId: 2, ConnectorType: 'Microphone' })
      const qm = { VuMeterAltered: { State: 'Start', ConnectorId: 2, ConnectorType: 'Microphone' } }
      InterMacro_Message.status(qm).post()

      //Set Selfview
      await delay(750)
      await selfviewSet()

      await swapUIto('USB_Mode')
      status = { fts: 'complete', state: 'USB_Mode' }
      await GMM.write('status', status)
      InterMacro_Message.status('USBModeStarted').post()
      console.log({ Message: 'USBModeStarted' })
    } else {
      console.warn({ Message: `EnteringUSBMode :: USB Mode already active on ${system.codec}, no action necessary`, Cause: cause })
    }
  }
}

/*
Save Webex Config will preserve any of your devices original settings, before moving into USB mode
  Not all config items are captured, only items relevant to USB Mode
Altering your Config when USB Mode is Active is not advised as this preservation only occurs when USB Mode is enabled
  Disable USB Mode before applying any new configuration changes
*/

async function saveWebexConfig() {
  const config = {}

  //Grab System Specific Configuration Settings
  switch (system.profile) {
    case 'room55':
      config['Audio_Output_Line_1'] = await xapi.Config.Audio.Output.Line[1].get()
      break;
    case 'plus':
      config['Audio_Output_Line_1'] = await xapi.Config.Audio.Output.Line[1].get()
      config['Audio_Microphones_AGC'] = await xapi.Config.Audio.Microphones.AGC.get()
      config['Video_Output_Connector_1_MonitorRole'] = await xapi.Config.Video.Output.Connector[1].MonitorRole.get()
      break;
    case 'pro': case 'pano':
      config['Video_Output_Connector_1_MonitorRole'] = await xapi.Config.Video.Output.Connector[1].MonitorRole.get()
      config['Video_Output_Connector_3_MonitorRole'] = await xapi.Config.Video.Output.Connector[3].MonitorRole.get()
      break;
    default:
      break;
  }

  //Grab Universal Configuration Settings 
  config['Video_Monitors'] = await xapi.Config.Video.Monitors.get()
  config['Video_Output_Connector_2_MonitorRole'] = await xapi.Config.Video.Output.Connector[2].MonitorRole.get()

  //Grab Current Selfview Status
  config['Video_Selfview'] = await xapi.Status.Video.Selfview.get()
  await GMM.write('config', config)
}

//*****[First Time Setup Function]************************

//FTS will run through USB Mode once to capture the initial config of the unit on startup
async function FTS() {
  //Multiple alerts called in case user clears the alert before FTS is complete
  const alert = function () { xapi.Command.UserInterface.Message.Alert.Display({ Title: ftsAlert_Setup_Title, Text: ftsAlert_Setup_Text }) }
  alert(); await buildPanels();
  alert(); await delay(1000);
  alert(); await load.USB_Mode('Running FTS, enabling USB mode for the first time', true)
  alert(); await delay(5000)
  alert(); await load.Webex_Mode('Running FTS, returning to Webex Mode', true)
  xapi.Command.UserInterface.Message.Alert.Display({ Title: ftsAlert_Complete_Title, Text: ftsAlert_Complete_Text, Duration: 10 })
  sendReport(`${module.name.replace('./', '')} FTS Complete`, 'Notification - First Time Setup Complete')
  console.warn({ Message: `${module.name.replace('./', '')} macro's FTS is complete, fully initialized and ready for use. Enjoy!` })
}

//*****[Presentation Related Functions]************************

//Used to initiate Screen Sharing based on configuration and system profile
async function shareScreen() {
  await xapi.Command.Presentation.Stop()
  const defaultSource = await xapi.Config.Video.Presentation.DefaultSource.get()
  if (psuedoConfig.codecPro_DualScreen_Mode.toString() != 'true' ? true : false) {
    switch (psuedoConfig.screenShare_Mode.toLowerCase()) {
      case 'auto':
        if (activeSource != 0 && activeSource != '0') {
          await xapi.Command.Presentation.Start({ ConnectorId: activeSource })
        } else {
          await xapi.Command.Presentation.Start({ ConnectorId: defaultSource })
        }
        break;
      case 'standard': default:
        await xapi.Command.Presentation.Start({ ConnectorId: defaultSource, Instance: 'New' })
        break;
    }
  } else {
    if (system.profile == 'pro' || system.profile == 'pano') {
      await xapi.Command.Video.Matrix.Assign({ Layout: 'Equal', Mode: 'Replace', Output: 1, SourceId: psuedoConfig.codecPro_DualScreen_Content_Input_1 });
      await xapi.Command.Video.Matrix.Assign({ Layout: 'Equal', Mode: 'Replace', Output: 2, SourceId: psuedoConfig.codecPro_DualScreen_Content_Input_2 });
      dualScreenSignalHandler = setInterval(dualScreenSignalQuery, 1000)
    }
  }
}

//Used to notify the user no source was detected after a set amount of time has passed
//This assumes the user did not connect a source input prior to pressing Enable USB Mode
async function noSignalDisconnectUSBmode() {
  if (status.state == 'USB_Mode') {
    load.Webex_Mode('No Source Input signal detected')
    if (USB_Mode_Uptime < 16) {
      await xapi.Command.UserInterface.Message.Alert.Display({
        Title: missingSourceText_Title,
        Text: missingSourceText_Text,
        Duration: missingSourceText_Duration
      })
    }
    clearInterval(USB_Mode_UptimeHandler);
    USB_Mode_Uptime = 0;
  }
}

//Used to swap sources for systems using codecPro_DualScreen_Mode and codecPro_DualScreen_SourceSwap_UI
function swapSources() {
  if (psuedoConfig.codecPro_DualScreen_Mode.toString() == 'true' ? true : false && psuedoConfig.codecPro_DualScreen_SourceSwap_UI.toString() == 'true' ? true : false) {
    xapi.Command.Video.Matrix.Swap({ OutputA: 1, OutputB: 2 });
  }
}

//Custom signal detection for Dual Screen mode, which mimics the base behavior
//of a single source sharing
async function dualScreenSignalQuery() {
  const io = {
    input1: (await xapi.Status.Video.Input.Connector[psuedoConfig.codecPro_DualScreen_Content_Input_1].Connected.get()) == 'True' ? true : false,
    input2: (await xapi.Status.Video.Input.Connector[psuedoConfig.codecPro_DualScreen_Content_Input_2].Connected.get()) == 'True' ? true : false
  }
  if (!io.input1 && !io.input2) {
    if (USB_Mode_Uptime > 13 && USB_Mode_Uptime < 16) {
      clearInterval(dualScreenSignalHandler)
      noSignalDisconnectUSBmode()
      return
    }
    if (USB_Mode_Uptime > 15) {
      clearInterval(dualScreenSignalHandler)
      load.Webex_Mode(`Dual Screen Mode; Input signal disconnected on both codecPro_DualScreen_Content_Input_1:[${psuedoConfig.codecPro_DualScreen_Content_Input_1}] or codecPro_DualScreen_Content_Input_2: [${psuedoConfig.codecPro_DualScreen_Content_Input_2}]`)
      return
    }
  }
}

//*****[Selfview Related Functions]************************

//Set's selfview for USB mode based on specific profile or codec characteristics
async function selfviewSet() {
  if (psuedoConfig.matrix_Camera_Mode.toString() != 'true' ? true : false && system.profile != 'pano') {
    switch (system.profile) {
      case 'room55': case 'plus':
        await xapi.Command.Video.Selfview.Set({ Mode: 'On', FullscreenMode: 'On', OnMonitorRole: 'Second' });
        break;
      case 'pro':
        switch (system.codec) {
          case 'SX80': case 'MX700': case 'MX700ST': case 'MX800': case 'MX800ST': case 'MX800D':
            try {
              await xapi.Command.Video.Selfview.Set({ Mode: 'On', FullscreenMode: 'On', OnMonitorRole: psuedoConfig.sx80_Mx700_800_videoOutput_Override })
            } catch (e) {
              await xapi.Command.Video.Selfview.Set({ Mode: 'On', FullscreenMode: 'On', OnMonitorRole: 'Second' });
            }
            break;
          default:
            await xapi.Command.Video.Selfview.Set({ Mode: 'On', FullscreenMode: 'On', OnMonitorRole: 'Third' });
            break;
        }
        break;
      case 'pano':
        await panoramaSelfView(true)
        break;
      default:
        break;
    }
  }
}

//function to enable Panorama Selfview
async function panoramaSelfView(state) {
  switch (state.toString()) {
    case 'On': case 'on': case 'ON': case true: case 'true':
      await xapi.Command.Video.Matrix.Assign({ Layout: 'Equal', Mode: 'Replace', Output: 3, SourceId: [1, 2] });
      break;
    default: case 'Off': case 'off': case 'OFF': case false: case 'false':
      await xapi.Command.Video.Matrix.Reset({ Output: 3 });
      break;
  }
}

//Function to update video output when using matrix camera mode
async function updateMatrixModeSelfview(state, input) {
  if (system.profile != 'room55') {
    let source = input
    if (input == 'Composed' || input == undefined) {
      if (lastKnownMain != undefined && lastKnownMain != 'undefined') {
        source = lastKnownMain
      } else {
        source = await xapi.Config.Video.DefaultMainSource.get()
      }
    }
    let output = 2;
    if (system.profile == 'pro') {
      output = 3
      switch (system.codec) {
        case 'SX80': case 'MX700': case 'MX700ST': case 'MX800': case 'MX800ST': case 'MX800D':
          if (psuedoConfig.sx80_Mx700_800_videoOutput_Override == 'Second') {
            output = 2
          }
          break;
      }
    }
    switch (state.toString()) {
      case 'On': case 'on': case 'ON': case true: case 'true':
        await xapi.Command.Video.Matrix.Assign({ Layout: 'Equal', Mode: 'Replace', Output: output, SourceId: source });
        break;
      default: case 'Off': case 'off': case 'OFF': case false: case 'false':
        await xapi.Command.Video.Matrix.Reset({ Output: output });
        break;
    }
  } else {
    error.report('matrix_Camera_Mode not supported on room55 profile', 'Devices with the room55 profile lack the xApi for Video Matrices. Please set matrix_Camera_Mode to false on your Cisco undefined', 'Reverting to normal Selfview method for camera capture')
  }
}

//*****[Check4 Functions]************************

//Checks codec model, and assigns a profile based on it's modal
//Native and Non compatible systems cause USB Mode to disable itself
async function check4_System_Compatibility() {
  system.codec = await xapi.Status.SystemUnit.ProductPlatform.get()
  switch (system.codec) {
    case 'Room 55':
      return 'room55';
    case 'Codec Plus': case 'Room Kit': case 'Room 55D': case 'Room 70D': case 'Room 70S':
      return 'plus'
    case 'Codec Pro': case 'Room 70D G2': case 'Room 70S G2': case 'SX80':
    case 'MX700': case 'MX700ST': case 'MX800': case 'MX800ST': case 'MX800D':
      return 'pro';
    case 'Room 70 Panorama': case 'Room Panorama':
      return 'pano'
    case 'Desk Pro': case 'Room Kit Mini': case 'Room USB': case 'Desk': case 'Desk Limited Edition':
    case 'Desk Hub': case 'Desk Mini': case 'Board Pro 55': case 'Board Pro 75':
      await error.disableUSBModeMacro(`${system.codec} supports Native USB passthrough`, `The Cisco ${system.codec} supports USB Passthrough capabilities natively and does not require additional hardware or a macro for operation. Please review this devices user guide and data sheet to learn more.`)
      return 'native';
    default:
      await error.disableUSBModeMacro(`${system.codec} is not compatible with ${module.name.replace('./', '')}`, `The Cisco ${system.codec} lacks the API and/or IO to make use of the USB Mode Macro. Please reference the CODEC Compatibility Matrix on https://roomos.cisco.com`)
      return 'not compatible'
  }
}

//Checks to see you're running the required minimum OS for certain features or base macro compatibility
async function check4_Minimum_Version_Required(minimumOs) {
  const reg = /^\D*(?<MAJOR>\d*)\.(?<MINOR>\d*)\.(?<EXTRAVERSION>\d*)\.(?<BUILDID>\d*).*$/i;
  const minOs = minimumOs; const os = await xapi.Status.SystemUnit.Software.Version.get();
  const x = (reg.exec(os)).groups; const y = (reg.exec(minOs)).groups;
  const thisVersion = (parseInt(x.MAJOR) * 8 * 3) + (parseInt(x.MINOR) * 8 * 2) + (parseInt(x.EXTRAVERSION) * 8 * 1) + (parseInt(x.BUILDID) * 8 * 0)
  const lockVersion = (parseInt(y.MAJOR) * 8 * 3) + (parseInt(y.MINOR) * 8 * 2) + (parseInt(y.EXTRAVERSION) * 8 * 1) + (parseInt(y.BUILDID) * 8 * 0)
  if (thisVersion >= lockVersion) { return true } else { return false }
}

//Enforces the lat known script state on initialization
async function check4_Script_State(activeMode) {
  console.log({ Message: `${module.name.replace('./', '')} last known state: ${activeMode}. Prepping UI for ${activeMode}` })
  await buildPanels()
  await swapUIto(activeMode)
}

//Checks to see if Ce-Console is available and contains the USB Mode Output Group
//A check is not made for the specific output connector, as it could change from system to system
async function check4_Ce_Console() {
  const ceConRegex = /^const\s*config\s*=\s*([0-9a-zA-Z\s\r\t",\[\{\}\]\:\.\-]*)/gmi
  let ceCon
  try {
    ceCon = (await xapi.Command.Macros.Macro.Get({ Name: 'ce-audio-config', Content: 'True' })).Macro[0].Content
  } catch (e) {
    if (e.message = 'No such macro') {
      await error.disableUSBModeMacro('Ce-Console not found', `Ce-Console was not found and is required for the Cisco ${system.codec}. Review the Ce-Console deployment guide for ${module.name.replace('./', '')}, apply the Ce-Console configuration before re-enabling ${module.name.replace('./', '')}`)
      return
    }
  }
  const ceConfigOutputGroups = (JSON.parse((ceConRegex.exec(ceCon))[1])).outputGroups
  const find_USBMOde_Output = ceConfigOutputGroups.find(function (item, i) {
    if (item.name.toLowerCase() == 'usb mode') {
      return ceConfigOutputGroups[i]
    }
  })
  if (find_USBMOde_Output != undefined) {
    console.log({ Message: 'Ce-Console configuration found with USB Mode output group', USBMOde_OutputGroupConfig: find_USBMOde_Output })
    return
  }
  await error.disableUSBModeMacro('USB Mode output group not found in Ce-Console', 'Please review the Ce-Console documentation for USB mode. We were unable to find the USB Mode output group')
  return

}

//Reaches out to Github, if it can, to see if a new version of USB Mode is available
//If yes, then it will print a message to the console
async function check4_New_USB_Mode_Version() {
  const x = version.split('-')
  const currentBase = (parseInt(x[0]) * (2 ** 8) ** 2) + (parseInt(x[1]) * (2 ** 8)) + (parseInt(x[2]))
  await xapi.Config.HttpClient.Mode.set('On')
  const params = {
    Url: 'https://raw.githubusercontent.com/CiscoDevNet/roomdevices-macros-samples/master/USB%20Mode%20Version%202/manifest.json',
    Header: []
  }
  try {
    const request = await xapi.Command.HttpClient.Get(params)
    const manifest = JSON.parse(request.Body)
    if (typeof manifest.MacroVersion != 'undefined') {
      const y = manifest.MacroVersion.split('-')
      const compareBase = (parseInt(y[0]) * (2 ** 8) ** 2) + (parseInt(y[1]) * (2 ** 8)) + (parseInt(y[2]))
      console.debug({ Message: 'Comparing against available USB Mode Version on git', Installed: { Version: version, Value: currentBase }, Available: { Version: manifest.MacroVersion, Value: compareBase } })
      if (compareBase > currentBase) {
        console.info({ News: `A New Version of USB Mode is available for download at https://roomos.cisco.com/macros`, CurrentVersion: version, NewVersion: manifest.MacroVersion })
        await sendReport({ News: `A New Version of USB Mode is available for download at https://roomos.cisco.com/macros`, CurrentVersion: version, NewVersion: manifest.MacroVersion }, 'Info')
      }
    } else {
      error.report('USB Mode Manifest File missing Macro Version Object', 'Unable to verify version available on RoomOs Git Repository', 'No action taken, however, be sure to check the RoomOs website for updates on USB Mode')
    }
  } catch (e) {
    error.report(`Failed USB Mode Version Check >> ${e.message}`, 'Unable to connect to the RoomOs Git Repository to compare this version of USB mode to what is currently available', 'No action taken, however, be sure to check the RoomOs website for updates on USB Mode')
  }
}

// Initial check for the Video Monitor configuration
async function check4_Video_Monitor_Config() {
  const videoMonitorConfig = await xapi.Config.Video.Monitors.get()
  return new Promise((resolve, reject) => {
    if (videoMonitorConfig != 'Auto') {
      resolve(videoMonitorConfig)
    } else {
      reject(new Error('xConfiguration Video Monitors can not be set to Auto for USB mode'))
    }
  })
}

//*****[UserInterface Related Functions]************************

//Used to set the Switching panel UI when switching between USB Mode and Webex Mode
function setTransitionUI() {
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_Enable_USBMode, Visibility: 'Hidden' }).catch(e => e)
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_Enable_WebexMode, Visibility: 'Hidden' }).catch(e => e)
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_DualPro_SwapSources, Visibility: 'Hidden' }).catch(e => e)
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_NotReady, Visibility: 'Auto' }).catch(e => e)
}

//Used to transition the UI from USB mode to Webex mode and vice versa
async function swapUIto(activeMode) {
  switch (activeMode) {
    case 'USB_Mode':
      xapi.Config.UserInterface.Features.HideAll.set('True')
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_NotReady, Visibility: 'Hidden' }).catch(e => e)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_Enable_USBMode, Visibility: 'Hidden' }).catch(e => e)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_Enable_WebexMode, Visibility: 'Auto' }).catch(e => e)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_DualPro_SwapSources, Visibility: 'Auto' }).catch(e => e)
      customPanel_visibility('Hidden')
      break;
    case 'Webex_Mode': default:
      xapi.Config.UserInterface.Features.HideAll.set('False')
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_NotReady, Visibility: 'Hidden' }).catch(e => e)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_Enable_WebexMode, Visibility: 'Hidden' }).catch(e => e)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_DualPro_SwapSources, Visibility: 'Hidden' }).catch(e => e)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_Enable_USBMode, Visibility: 'Auto' }).catch(e => e)
      customPanel_visibility('Auto')
      break;
  }
}

//Constructs All panels needed for USB Mode
async function buildPanels() {
  let check4usbpanels = 0;
  let minimumPanels = 3
  const panels = await xapi.Command.UserInterface.Extensions.List({ ActivityType: 'Custom' })
  if (typeof panels.Extensions != 'undefined' && typeof panels.Extensions.Panel != 'undefined') {
    for (let i = 0; i < panels.Extensions.Panel.length; i++) {
      switch (panels.Extensions.Panel[i].PanelId) {
        case panelIds.projectUSB_NotReady:
          if (switching_Panel_Text != panels.Extensions.Panel[i].Name) { check4usbpanels--; }
        case panelIds.projectUSB_Enable_USBMode:
          if (enableUSB_Mode_Panel_Text != panels.Extensions.Panel[i].Name) { check4usbpanels--; }
        case panelIds.projectUSB_Enable_WebexMode:
          if (enableWebex_Mode_Panel_Text != panels.Extensions.Panel[i].Name) { check4usbpanels--; }
        case panelIds.projectUSB_DualPro_SwapSources:
          if (psuedoConfig.codecPro_DualScreen_Mode.toString() == 'true' ? true : false && psuedoConfig.codecPro_DualScreen_SourceSwap_UI.toString() == 'true' ? true : false) {
            minimumPanels++
            if (sourceSwap_Panel_Text != panels.Extensions.Panel[i].Name) { check4usbpanels--; }
          }
          check4usbpanels++;
          break;
        default:
          break;
      }
    }
  }
  if (check4usbpanels < minimumPanels) {
    if (psuedoConfig.codecPro_DualScreen_Mode.toString() == 'true' ? true : false && psuedoConfig.codecPro_DualScreen_SourceSwap_UI.toString() == 'true' ? true : false) {
      xapi.command('Userinterface Extensions Panel Save', {
        PanelId: panelIds.projectUSB_DualPro_SwapSources
      }, `<Extensions><Panel><Origin>local</Origin><Type>Home</Type><Icon>Tv</Icon><Color>#E74C3C</Color><Name>${sourceSwap_Panel_Text}</Name><ActivityType>Custom</ActivityType></Panel></Extensions>`)
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: panelIds.projectUSB_DualPro_SwapSources, Visibility: 'Hidden' }).catch(e => e)
    } else {
      xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_DualPro_SwapSources })
    }
    xapi.command('Userinterface Extensions Panel Save', {
      PanelId: panelIds.projectUSB_NotReady
    }, `<Extensions><Panel><Origin>local</Origin><Type>Home</Type><Icon>Input</Icon><Color>#D8D8D8</Color><Name>${switching_Panel_Text}</Name><ActivityType>Custom</ActivityType></Panel></Extensions>`)

    if (psuedoConfig.hide_EnableUSBMode_Panel.toString() != 'true' ? true : false) {
      xapi.command('Userinterface Extensions Panel Save', {
        PanelId: panelIds.projectUSB_Enable_USBMode
      }, `<Extensions><Panel><Origin>local</Origin><Type>Home</Type><Icon>Input</Icon><Color>#335A9A</Color><Name>${enableUSB_Mode_Panel_Text}</Name><ActivityType>Custom</ActivityType></Panel></Extensions> `)
    } else {
      xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_Enable_USBMode })
    }

    if (psuedoConfig.hide_EnableWebexMode_Panel.toString() != 'true' ? true : false) {
      xapi.command('Userinterface Extensions Panel Save', {
        PanelId: panelIds.projectUSB_Enable_WebexMode
      }, `<Extensions><Panel><Origin>local</Origin><Type>Home</Type><Icon>Input</Icon><Color>#FFA300</Color><Name>${enableWebex_Mode_Panel_Text}</Name><ActivityType>Custom</ActivityType></Panel></Extensions> `)
    } else {
      xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_Enable_WebexMode })
    }
  }
}

//Used to hide or show custom UI panels
//Governed by user set config above
function customPanel_visibility(state) {
  let inverse = state == 'Auto' ? 'Hidden' : 'Auto';
  let panels = { Message: '', Panels: [] }
  if (psuedoConfig.hideCustomPanels_inUSBMode.toString() == "true" ? true : false) {
    if (state == "Hidden") {
      panels.Message = 'Hide Custom UI in USB_Mode is enabled, Hiding the following panel IDs: '
    } else { panels.Message = 'Hide Custom UI in USB_Mode is enabled, Showing the following panel IDs: ' }
    for (let i = 0; i < psuedoConfig.hideCustomPanels_inUSBMode_PanelIds.length; i++) {
      panels.Panels.push(psuedoConfig.hideCustomPanels_inUSBMode_PanelIds[i])
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: psuedoConfig.hideCustomPanels_inUSBMode_PanelIds[i], Visibility: state }).catch(e => console.debug(e))
    }
    console.log(panels)
  } else {
    for (let i = 0; i < psuedoConfig.hideCustomPanels_inUSBMode_PanelIds.length; i++) {
      panels.Panels.push(psuedoConfig.hideCustomPanels_inUSBMode_PanelIds[i])
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: psuedoConfig.hideCustomPanels_inUSBMode_PanelIds[i], Visibility: 'Auto' }).catch(e => console.debug(e))
    }
  }
  panels.Panels = []
  if (psuedoConfig.hideCustomPanels_inWebexMode.toString() == "true" ? true : false) {
    if (state == 'Auto') {
      panels.Message = 'Hide Custom UI in Webex_Mode is enabled, Hiding the following panel IDs: '
    } else { panels.Message = 'Hide Custom UI in Webex_Mode is enabled, Showing the following panel IDs: ' }
    for (let i = 0; i < psuedoConfig.hideCustomPanels_inWebexMode_PanelIds.length; i++) {
      panels.Panels.push(psuedoConfig.hideCustomPanels_inWebexMode_PanelIds[i])
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: psuedoConfig.hideCustomPanels_inWebexMode_PanelIds[i], Visibility: inverse }).catch(e => console.debug(e))
    }
    console.log(panels)
  } else {
    for (let i = 0; i < psuedoConfig.hideCustomPanels_inWebexMode_PanelIds.length; i++) {
      panels.Panels.push(psuedoConfig.hideCustomPanels_inWebexMode_PanelIds[i])
      xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: psuedoConfig.hideCustomPanels_inWebexMode_PanelIds[i], Visibility: 'Auto' }).catch(e => console.debug(e))
    }
  }
}

//*****[Reporting Related Functions]************************

//Used to verify configuration for reporting mode and set's up various reporting endpoints
// based on provided user config
async function setupReporting() {
  if (psuedoConfig.reporting_Mode.toString() == 'true' ? true : false) {
    report['userGroup'] = { message: '', active: false }
    report['roomGroup'] = { message: '', active: false }
    if (psuedoConfig.reporting_Token != '' && psuedoConfig.reporting_Token != undefined) {
      if (psuedoConfig.reporting_Users != '' && psuedoConfig.reporting_Users != undefined) {
        report.userGroup.message = new GMM.Message.Webex.User(psuedoConfig.reporting_Token, psuedoConfig.reporting_Users)
        report.userGroup.active = true
        console.log({ Message: `Error Reporting enabled for User Group: [${psuedoConfig.reporting_Users.toString().replace(/,/gm, ', ')}]` })
      }
      if (psuedoConfig.reporting_Rooms != '' && psuedoConfig.reporting_Rooms != undefined) {
        report.roomGroup.message = new GMM.Message.Webex.Room(psuedoConfig.reporting_Token, psuedoConfig.reporting_Rooms)
        report.roomGroup.active = true
        console.log({ Message: `Error Reporting enabled for Room Group: [${psuedoConfig.reporting_Rooms.toString().replace(/,/gm, ', ')}]}` })
      }
      if (!report.userGroup.active && !report.roomGroup.active) {
        console.error({ Error: `Error Reporting Enabled but User and Room destinations are not defined in the ${module.name.replace('./', '')} Macro configuration section`, Solution: 'Either provide user emails or Cisco Room Ids in the config section or set reporting_Mode to false' })
      }
    } else {
      console.error({ Error: `Error Reporting Token not defined in the ${module.name.replace('./', '')} Macro configuration section`, Solution: 'Either provide a token or set reporting_Mode to false' })
    }
  }
}

//Used to send reports out to Webex Spaces id enabled
async function sendReport(details, type = 'N/A') {
  const msg = `\n- - -\n# USB Mode Report\n### Type: ${type}\n**[ Details ]**\n\`\`\`\n${JSON.stringify(details, null, 2)}\n\`\`\``;
  if (psuedoConfig.reporting_Mode.toString() == 'true' ? true : false) {
    if (report.userGroup.active) {
      await report.userGroup.message.body(msg).post()
    }
    if (report.roomGroup.active) {
      await report.roomGroup.message.body(msg).post()
    }
  }
}

//Error is used to highlight when there is a notable error, and provides reporting if enabled
//Error can be used to disable USB mode should there be unfavorable conditions we can't account for
const error = {
  report: async function (error, message, action, prompt = false) {
    let text = { USBModeError: { Error: error, Message: message, Action: action } }
    if (prompt) { await xapi.Command.UserInterface.Message.Alert.Display({ Title: 'Error with USB Mode', Text: text.USBModeDisabled.Message, Duration: 30 }) }
    await sendReport(text.USBModeDisabled, 'ERROR - USB Mode disabled on endpoint')
    console.error(text)
    InterMacro_Message.error(text).post()
  },
  disableUSBModeMacro: async function (error, message) {
    let text = { USBModeDisabled: { Error: error, Message: message, Action: `UI Elements will be removed and the ${module.name.replace('./', '')} macro will be disabled` } }
    let macro = module.name.split('./')[1]
    await xapi.Command.UserInterface.Message.Alert.Display({
      Title: 'USB Mode Disabled',
      Text: text.USBModeDisabled.Message,
      Duration: 30
    })
    await sendReport(text.USBModeDisabled, 'ERROR - USB Mode disabled on endpoint')
    console.error(text)
    InterMacro_Message.error(text).post()
    await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_Enable_USBMode }).catch(e => e)
    await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_Enable_WebexMode }).catch(e => e)
    await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_NotReady }).catch(e => e)
    await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: panelIds.projectUSB_DualPro_SwapSources }).catch(e => e)
    await xapi.Command.Macros.Macro.Deactivate({ Name: macro })
    await delay(3000);
    await xapi.Command.Macros.Runtime.Restart();
  }
}

//*****[Functions End]************************