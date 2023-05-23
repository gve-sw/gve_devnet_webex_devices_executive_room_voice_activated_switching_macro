/*
CISCO BOARDROOM VERSION 2.0 - AUXILIARY CODEC MACRO
Copyright (c) 2023 Cisco and/or its affiliates.
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
*
* Repository: gve_devnet_webex_devices_executive_room_voice_activated_switching_macro
* Macro file: aux_codec_macro
* Version: 2.1.2
* Released: May 23, 2023
* Latest RoomOS version tested: 11.4
*
* Macro Author:      	Gerardo Chaves
*                    	Technical Solutions Architect
*                    	gchaves@cisco.com
*                    	Cisco Systems
*
* Consulting Engineer: Robert(Bobby) McGonigle Jr
*                    	 Technical Marketing Engineer
*                    	 bomcgoni@cisco.com
*                    	 Cisco Systems
* 
*    
* 
*    As a macro, the features and functions of this webex devices executive room voice activated 
*    switching macro are not supported by Cisco TAC
* 
*    Hardware and Software support are provided by their respective manufacturers 
*      and the service agreements they offer
*    
*    Should you need assistance with this macro, reach out to your Cisco sales representative
*    so they can engage the GVE DevNet team. 
*/

import xapi from 'xapi';
import { GMM } from './GMM_Lib'

/////////////////////////////////////////////////////////////////////////////////////////
// INSTALLER SETTINGS
/////////////////////////////////////////////////////////////////////////////////////////

// IP Address of MAIN codec (i.e. CodecPro)
const MAIN_CODEC_IP = '10.10.10.11';

// MAIN_CODEC_USERNAME and MAIN_CODEC_PASSWORD are the username and password of a user with integrator or admin roles on the Main Codec
// Here are instructions on how to configure local user accounts on Webex Devices: https://help.webex.com/en-us/jkhs20/Local-User-Administration-on-Room-and-Desk-Devices)
const MAIN_CODEC_USERNAME = 'username';
const MAIN_CODEC_PASSWORD = 'password';

// Set USE_ST_BG_MODE to true if you want keep Quacams Speaker Tracking even while not being used
const USE_ST_BG_MODE = true;

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ DO NOT EDIT ANYTHING BELOW THIS LINE                                  +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/


/////////////////////////////////////////////////////////////////////////////////////////
// UTILITIES
/////////////////////////////////////////////////////////////////////////////////////////

function encode(s) {
  var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    o = [];
  for (var i = 0, n = s.length; i < n;) {
    var c1 = s.charCodeAt(i++),
      c2 = s.charCodeAt(i++),
      c3 = s.charCodeAt(i++);
    o.push(c.charAt(c1 >> 2));
    o.push(c.charAt(((c1 & 3) << 4) | (c2 >> 4)));
    o.push(c.charAt(i < n + 2 ? ((c2 & 15) << 2) | (c3 >> 6) : 64));
    o.push(c.charAt(i < n + 1 ? c3 & 63 : 64));
  }
  return o.join("");
}

const MAIN_CODEC_AUTH = encode(MAIN_CODEC_USERNAME + ':' + MAIN_CODEC_PASSWORD);

/////////////////////////////////////////////////////////////////////////////////////////
// STARTUP SCRIPT
// The following sections constitute a startup script that the codec will run whenever it
// boots.
/////////////////////////////////////////////////////////////////////////////////////////


xapi.config.set('Video Monitors', 'Single');
xapi.config.set('Video Output Connector 1 MonitorRole', 'First');
xapi.config.set('Standby Halfwake Mode', 'Manual').catch((error) => {
  console.log('Your software version does not support this configuration.  Please install ‘Custom Wallpaper’ on the codec in order to prevent Halfwake mode from occurring.');
  console.error(error);
});

xapi.config.set('Standby Control', 'Off');
xapi.command('Video Selfview Set', { Mode: 'On', FullScreenMode: 'On', OnMonitorRole: 'First' })
  .catch((error) => { console.error(error); });

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
/////////////////////////////////////////////////////////////////////////////////////////

let main_codec = { url: MAIN_CODEC_IP, auth: MAIN_CODEC_AUTH };

//Declare your object for GMM communication
var mainCodec;
/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

// ---------------------- INITIALIZATION

function init() {
  console.log('init');

  try {
    mainCodec = new GMM.Connect.IP(MAIN_CODEC_AUTH, '', MAIN_CODEC_IP)
  } catch (e) {
    console.error(e)
  }

  // register callback for processing messages from main codec
  xapi.Command.Cameras.SpeakerTrack.Activate();
}
// ---------------------- ERROR HANDLING

function handleError(error) {
  console.log(error);
}

/////////////////////////////////////////////////////////////////////////////////////////
// INTER-MACRO MESSAGE HANDLING
/////////////////////////////////////////////////////////////////////////////////////////
GMM.Event.Receiver.on(event => {
  if (event.Type == 'Error') {
    console.error(event)
  } else {
    switch (event.Value) {
      case "VTC-1_status":
        handleMacroStatus();
        break;
      case 'wake_up':
        handleWakeUp();
        break;
      case 'shut_down':
        handleShutDown();
        break;
      case 'side_by_side':
        handleSideBySide();
        break;
      case 'automatic_mode':
        handleAutomaticMode();
        break;
      default:
        break;
    }
  }
})



// ---------------------- INTER-CODEC COMMUNICATION

async function sendIntercodecMessage(message) {
  console.log(`sendIntercodecMessage: codec = ${main_codec.url} | message = ${message}`);
  if (mainCodec != '') mainCodec.status(message).queue().catch(e => {
    console.log('Error sending message');
    alertFailedIntercodecComm("Error connecting to codec for first camera, please contact the Administrator");
  });
}


GMM.Event.Queue.on(report => {
  //The queue will continuously log a report to the console, even when it's empty.
  //To avoid additional messages, we can filter the Queues Remaining Requests and avoid it if it's equal to Empty
  if (report.QueueStatus.RemainingRequests != 'Empty') {
    report.Response.Headers = [] // Clearing Header response for the simplicity of the demo, you may need this info
    //console.log(report)
  }
});

// ---------------------- MACROS


async function handleMacroStatus() {
  console.log('handleMacroStatus');
  await sendIntercodecMessage('VTC-1_OK');
}

function handleWakeUp() {
  console.log('handleWakeUp');

  // send required commands to this codec
  xapi.command('Standby Deactivate').catch(handleError);
  xapi.Command.Cameras.SpeakerTrack.Activate();

}

function handleShutDown() {
  console.log('handleShutDown');

  // send required commands to this codec
  xapi.command('Standby Activate').catch(handleError);
}

function handleSideBySide() {
  console.log('handleSideBySide');

  // send required commands to this codec
  //xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
  pauseSpeakerTrack();
  xapi.command('Camera Preset Activate', { PresetId: 30 }).catch(handleError);
}

function handleAutomaticMode() {
  console.log('handleAutomaticMode');

  // send required commands to this codec
  //xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
  resumeSpeakerTrack();
}

function resumeSpeakerTrack() {
  if (USE_ST_BG_MODE) xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Deactivate().catch(handleError);
  else xapi.Command.Cameras.SpeakerTrack.Activate().catch(handleError);
}

function pauseSpeakerTrack() {

  if (USE_ST_BG_MODE) xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Activate().catch(handleError);
  else xapi.Command.Cameras.SpeakerTrack.Deactivate().catch(handleError);
}

xapi.Status.Cameras.SpeakerTrack.Availability
  .on((value) => {
    console.log("Event received for SpeakerTrack Availability: ", value)
    if (value == "Available") {
      init()
    }
  });

init();