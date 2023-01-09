/*
Copyright (c) 2021 Cisco and/or its affiliates.
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
*/
/////////////////////////////////////////////////////////////////////////////////////////
// REQUIREMENTS
/////////////////////////////////////////////////////////////////////////////////////////

import xapi from 'xapi';
import { GMM } from './GMM_Lib'

/////////////////////////////////////////////////////////////////////////////////////////
// INSTALLER SETTINGS
/////////////////////////////////////////////////////////////////////////////////////////


/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 1 - SECTION 1 - SECTION 1 - SECTION 1 - SECTION 1 - SECTION 1 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/

// IP Address of AUX codec (i.e. CodecPlus)
// NOTE: if there is no auxiliary codec, you must set the value of AUX_CODEC_IP to ''  (const AUX_CODEC_IP ='')
const AUX_CODEC_IP ='10.10.10.10';

// AUX_CODEC_USERNAME and AUX_CODEC_PASSWORD are the username and password of a admin-level user on the Auxiliary codec
// Here are instructions on how to configure local user accounts on Webex Devices:
// https://help.webex.com/en-us/jkhs20/Local-User-Administration-on-Room-and-Desk-Devices)
const AUX_CODEC_USERNAME='username';
const AUX_CODEC_PASSWORD='password';

// Video source and SpeakerTrack constants needed for defining mapping. DO NOT EDIT
const  SP=0, V1=1, V2=2, V3=3, V4=4, V5=5, V6=6

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 2 - SECTION 2 - SECTION 2 - SECTION 2 - SECTION 2 - SECTION 2 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/

// CAMERA / MICROPHONE ZONE PRESET OBJECTS (Z1 - Z8)
// This section is used if you have one or two PTZ cameras (either Precision 60 or PTZ 4K),
// and you want to define up to 8 microphone zones that will be serviced by Pan Tilt Zoom cameras.
// This can be in combination with one or two Quad Cameras, or without any Quad Cameras.
// The maximum number of PTZ Microphone Zones is 8. If you have one Quad Camera, it will use one of your mic inputs,
// and if you have two Quad Cameras, they will use two of your mic inputs. This leaves you with 7 or 6 zones for PTZ cameras.
// FOR EACH PTZ MICROPHONE ZONE (UP TO 8) YOU MUST DEFINE AT LEAST A PRIMARY CAMERA PRESET ID.
// If you have two PTZ cameras, you can define a primary and a secondary camera for each microphone zone.
// The reason: if Camera "A" is in use already, you will want to use Camera "B" for the next shot,
// so that the far end does not see camera motion, which could be distracting/dizzying.
// WARNING: Do not delete Z0 even if you do not intend to use camera zones, it is needed to initialize the "last camera zone used" global.
// You can define as many camera preset objects as needed up to 8, using the ZN naming convention.
// If you do not have any PTZ cameras connected to the codec, simply leave Z1 and Z2 defined as below as examples but
// do not use them in your MAP_CAMERA_SOURCES array
// NOTE: Mic inputs that trigger Quad Cameras do not use "PTZ Microphone Zones". Instead they trigger either "SP" (SpeakerTrack = local Quad Camera),
// V1, or V2 (video inputs used by Aux Codec Plus that run their own Quad Camera)
// NOTE: If you do not have a secondary preset for a zone, just use the same as the primary as the code needs that 'secondary' key present

const Z0= {'primary': 0, 'secondary': 0} //DO NOT DELETE OR COMMENT ME!!!!!
const Z1= {'primary': 11, 'secondary': 12} // These are ok to change
const Z2= {'primary': 14, 'secondary': 13} // These are ok to change
// Add camera zones below if needed to map in MAP_CAMERA_SOURCES, up to to Z8 but they can reference
// preset IDs 11-35 depending on which are configured on the codec. PresetID 30 IS RESERVED FOR USE BY THE PROGRAM
//Z3= {'primary': 5,'secondary': 6}

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 3 - SECTION 3 - SECTION 3 - SECTION 3 - SECTION 3 - SECTION 3 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/


// Microphone Input Numbers to Monitor
// Specify the input connectors associated to the microphones being used in the room
// For example, if you set the value to [1,2,3,4,5,6,7,8] the macro will evaluate mic input id's 1-8 for its switching logic
const MICROPHONE_CONNECTORS = [1,2,3,4,5,6,7,8];

// Camera source IDs that correspond to each microphone in MICROPHONE_CONNECTORS array
// Associate the connectors to specific input source type/id corresponding to the camera that covers where the mic is located.
// For example, if you set MICROPHONE_CONNECTORS = [1,2,3,4,5,6,7,8] and MAP_CAMERA_SOURCES to [V1,V1,V1,V2,V2,V2,Z1,Z2]
// you are specifying that
// mics 1,2 and 3 located where Camera associated to video input 1 (V1) is pointing at and
// mics 4,5 and 6 are located where Camera associated to video input 2 (V2) is pointing at and
// mic 7 is associated to PTZ camera defined in the zone Z1 object above and
// mic 8 is associated to PTZ camera defined in the zone Z2 object above
// Valid values for entries in the MAP_CAMERA_SOURCES array are: SP, V1-V2 and Z1-Z8
const MAP_CAMERA_SOURCES = [V1,V1,V1,V2,V2,V2,Z1,Z2];

// Specifying which sourceID belongs to local QuadCam
// MAIN_CODEC_QUADCAM_SOURCE_ID should contain the SourceID where the QuadCam connected
// to the main codec (if any) is connected. This it typically SourceID 1. If no QuadCam is connected
// then set this to 0
const MAIN_CODEC_QUADCAM_SOURCE_ID=1;

// Mapping of video sources to CameraIDs for PTZ cameras
// MAP_PTZ_CAMERA_VIDEO_SOURCE_ID contains an object of key/value pairs that maps
// each Camera ID (key) to the video input source ID it is connected to (value).
// so, if we set it to { '1':1, '2':2, '3':6 } then it indicates that camera ID 1 is connected
// to video source 1, camera ID 2 is connected to video source 2 and camera ID 3 is connected
// to video source 6. You can define as many cameras as needed in this object or leave it with the
// sample values defined below if you are not using PTZ cameras.
// Only cameras involved in the camera zone preset objects (Z1 - Z8) need to be mapped here
const MAP_PTZ_CAMERA_VIDEO_SOURCE_ID = { '2':6, '3':2, '4':4 };

// This next line hides the mid-call controls “Lock meeting” and “Record”.  The reason for this is so that the
// “Camera Control” button can be seen.  If you prefer to have the mid-call controls showing, change the value of this from “Hidden” to “Auto”
xapi.Config.UserInterface.Features.Call.MidCallControls.set("Hidden");

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 4 - SECTION 4 - SECTION 4 - SECTION 4 - SECTION 4 - SECTION 4 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/

// overviewShowDouble defines what is shown on the far end (the video the main codec sends into the call or conference) when in "OVERVIEW" mode where nobody is speaking or there is no
// prominent speaker detected by any of the microphones
// INSTRUCTIONS: If you are using side-by-side mode as your default - "overviewShowDouble = true" - then you must set up a camera preset for each Quad Camera
// with a Preset ID of 30.  The JavaScript for side-by-side mode uses Preset 30.
const overviewShowDouble = true;

// OVERVIEW_SINGLE_SOURCE_ID specifies the source video ID to use when in overview mode if you set overviewShowDouble to false
const OVERVIEW_SINGLE_SOURCE_ID = 3;

// OVERVIEW_PRESET_ZONE specifies the PTZ camera defined zone to be used for showing an 'overview' of the room
// NOTE: OVERVIEW_PRESET_ZONE takes precedence over OVERVIEW_SINGLE_SOURCE_ID. Leave it as Z0 if you do not want to use it, otherwise
// define it like any other zone (i.e.{'primary': 1,'secondary': 2} )
// NOTE: You still need to set overviewShowDouble to false to be able to use OVERVIEW_PRESET_ZONE
const OVERVIEW_PRESET_ZONE = Z0;
//const OVERVIEW_PRESET_ZONE = {'primary': 1,'secondary': 2};

// OVERVIEW_DOUBLE_SOURCE_IDS specifies the source video array of two IDs to use when in overview mode if you set overviewShowDouble to true
// it will display the two sources side by side on the main screen with the first value of the array on the
// left and the second on the right.
const OVERVIEW_DOUBLE_SOURCE_IDS = [2,1];

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ SECTION 5 - SECTION 5 - SECTION 5 - SECTION 5 - SECTION 5 - SECTION 5 +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

TIMERS and THRESHOLDS
*/


// Time to wait for silence before setting Speakertrack Side-by-Side mode
const SIDE_BY_SIDE_TIME = 10000; // 10 seconds
// Time to wait before switching to a new speaker
const NEW_SPEAKER_TIME = 2000; // 2 seconds
// Time to wait before activating automatic mode at the beginning of a call
const INITIAL_CALL_TIME = 15000; // 15 seconds
// time to wait after setting a camera preset before switching to it's source to prevent
// transmitting video during camera movement for P60 and PTZ cameras
const VIDEO_SOURCE_SWITCH_WAIT_TIME = 500; // 500 ms

/////////////////////////////////////////////////////////////////////////////////////////
// CONSTANTS/ENUMS
/////////////////////////////////////////////////////////////////////////////////////////


const AUX_CODEC_AUTH=encode(AUX_CODEC_USERNAME+':'+AUX_CODEC_PASSWORD); // DO NOT EDIT

// Microphone High/Low Thresholds
const MICROPHONELOW  = 6;
const MICROPHONEHIGH = 25;

const minOS10Version='10.17.1.0';
const minOS11Version='11.0.0.4';

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+ DO NOT EDIT ANYTHING BELOW THIS LINE                                  +
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/

const localCallout = new GMM.Connect.Local(module.name.replace('./', ''))


/////////////////////
// MAPPING VALIDATION
/////////////////////

const sleep = (timeout) => new Promise((resolve) => {
  setTimeout(resolve, timeout);
});


async function validate_mappings() {
    const timeout = 2000; // Milliseconds, equals 2 seconds

    if (MICROPHONE_CONNECTORS.length != MAP_CAMERA_SOURCES.length) {
        console.log('ERROR: There is a mismatch between the number of microphones defined and the number of camera sources mapped:');
        console.log('Microphone connectors defined: ', MICROPHONE_CONNECTORS);
        console.log('Map of camera sources: ', MAP_CAMERA_SOURCES);
        while (true) {
                console.log('Please stop this Camera Switcher Macro, correct the microphones/camera sources mismatch and re-start...');
                await sleep(timeout);
        }

    }

    if (MAP_CAMERA_SOURCES.indexOf(SP)!=-1) {
        if  (MAP_CAMERA_SOURCES.indexOf(SP) != MAP_CAMERA_SOURCES.lastIndexOf(SP))
        {
            console.log('ERROR: There can only be one or zero SpeakerTrack (value 0) cameras sources defined in the map:');
            console.log('Map of camera sources: ', MAP_CAMERA_SOURCES);
            while (true) {
                    console.log('Please stop this Camera Switcher Macro, make sure there is only 1 or 0 SpeakerTrack cameras configured and re-start...');
                    await sleep(timeout);
            }
        }
    }
}

validate_mappings();

// below we check for the existence of a SpeakerTrack camera configured for the codec
// so we can safely issue SpeakerTrack related commands
let has_SpeakerTrack= MAP_CAMERA_SOURCES.indexOf(SP) != -1 ||
                        MAP_CAMERA_SOURCES.indexOf(V1) != -1;


/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
/////////////////////////////////////////////////////////////////////////////////////////
let AUX_CODEC={ enable: (AUX_CODEC_IP!='') , online: false, url: AUX_CODEC_IP, auth: AUX_CODEC_AUTH};
let micArrays={};
for (var i in MICROPHONE_CONNECTORS) {
    micArrays[MICROPHONE_CONNECTORS[i].toString()]=[0,0,0,0];
}
let lowWasRecalled = false;
let lastActiveHighInput = 0;
let allowSideBySide = true;
let sideBySideTimer = null;
let InitialCallTimer = null;
let allowCameraSwitching = false;
let allowNewSpeaker = true;
let newSpeakerTimer = null;
let manual_mode = true;
let lastActivePTZCameraZoneObj=Z0;
let lastActivePTZCameraZoneCamera='0';

let perma_sbs=false; // set to true if you want to start with side by side view always

let micHandler= () => void 0;

let usb_mode=false;
let webrtc_mode=false;

let isOSTen=false;
let isOSEleven=false;

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

async function getPresetCamera(prID) {
  const value =  await xapi.Command.Camera.Preset.Show({ PresetId: prID });
  return(value.CameraId)
}

async function check4_Minimum_Version_Required(minimumOs) {
  const reg = /^\D*(?<MAJOR>\d*)\.(?<MINOR>\d*)\.(?<EXTRAVERSION>\d*)\.(?<BUILDID>\d*).*$/i;
  const minOs = minimumOs; 
  const os = await xapi.Status.SystemUnit.Software.Version.get();
  console.log(os)
  const x = (reg.exec(os)).groups; 
  const y = (reg.exec(minOs)).groups;
  if (parseInt(x.MAJOR) > parseInt(y.MAJOR)) return true; 
  if (parseInt(x.MAJOR) < parseInt(y.MAJOR)) return false; 
  if (parseInt(x.MINOR) > parseInt(y.MINOR)) return true; 
  if (parseInt(x.MINOR) < parseInt(y.MINOR)) return false; 
  if (parseInt(x.EXTRAVERSION) > parseInt(y.EXTRAVERSION)) return true; 
  if (parseInt(x.EXTRAVERSION) < parseInt(y.EXTRAVERSION)) return false; 
  if (parseInt(x.BUILDID) > parseInt(y.BUILDID)) return true; 
  if (parseInt(x.BUILDID) < parseInt(y.BUILDID)) return false; 
  return false;
} 

/////////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION
/////////////////////////////////////////////////////////////////////////////////////////



function evalFullScreen(value) {
	if (value=='On') {
		xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_FS_selfview', Value: 'on'});
	}
	else
	{
		xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_FS_selfview' , Value: 'off'});
	}
}

// evalFullScreenEvent is needed because we have to check when someone manually turns on full screen
// when self view is already selected... it will eventually check FullScreen again, but that should be
// harmless
function evalFullScreenEvent(value)
{
	if (value=='On') {
		xapi.Status.Video.Selfview.Mode.get().then(evalSelfView);
	}
	else
	{
		xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_FS_selfview', Value: 'off'});
	}
}

function evalSelfView(value) {
	if (value=='On') {
		xapi.Status.Video.Selfview.FullscreenMode.get().then(evalFullScreen);
	}
	else
	{
		xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_FS_selfview', Value: 'off'});
	}
}

async function init() {
  console.log('init');
  // configure HTTP settings
  xapi.config.set('HttpClient Mode', 'On').catch(handleError);
  xapi.config.set('HttpClient AllowInsecureHTTPS:', 'True').catch(handleError);
  xapi.config.set('HttpClient AllowHTTP:', 'True').catch(handleError);

  // Stop any VuMeters that might have been left from a previous macro run with a different MICROPHONE_CONNECTORS constant
  // to prevent errors due to unhandled vuMeter events.
  xapi.Command.Audio.VuMeter.StopAll({ });

  // register callback for processing manual mute setting on codec
  xapi.Status.Audio.Microphones.Mute.on((state) => {
      console.log(`handleMicMuteResponse: ${state}`);

      if (state == 'On') {
          stopSideBySideTimer();
          setTimeout(handleMicMuteOn, 2000);
      }
      else if (state == 'Off') {
            handleMicMuteOff();
      }
  });

  // register callback for processing messages from aux_codec
  xapi.event.on('Message Send', handleMessage);

  // register event handlers for local events
  xapi.Status.Standby.State
	.on(value => {
					console.log(value);
             		 if (value=="Off") handleWakeUp();
             		 if (value=="Standby") handleShutDown();
	});

    // register handler for Widget actions
    xapi.event.on('UserInterface Extensions Widget Action', (event) =>
                            handleOverrideWidget(event));

    // register handler for Call Successful
    xapi.Event.CallSuccessful.on(async () => {
      console.log("Starting new call timer...");
      await startAutomation();
      recallSideBySideMode();
      startInitialCallTimer();
    });

    // register handler for Call Disconnect
    xapi.Event.CallDisconnect.on(async () => {
        console.log("Turning off Self View....");
        xapi.Command.Video.Selfview.Set({ Mode: 'off'});
        webrtc_mode=false; // ending webrtc calls is being notified here now in RoomOS11
        stopAutomation();
    });

    // check RoomOS versions

    isOSTen=await check4_Minimum_Version_Required(minOS10Version);
    isOSEleven=await check4_Minimum_Version_Required(minOS11Version);

    // register WebRTC Mode if RoomOS 11
    if (isOSEleven) {
        xapi.Status.UserInterface.WebView.Type
        .on(async(value) => {
          if (value==='WebRTCMeeting') {
            webrtc_mode=true;

            console.log("Starting automation due to WebRTCMeeting event...");
            startAutomation();
            startInitialCallTimer();

          } else {
            webrtc_mode=false;
            if (!usb_mode) {
                console.log("Turning off Self View....");
                xapi.Command.Video.Selfview.Set({ Mode: 'off'});
                console.log("Stopping automation due to a non-WebRTCMeeting  event...");
                stopAutomation();
              }

          }
        });
    }

    //  set self-view toggle on custom panel depending on Codec status that might have been set manually
    xapi.Status.Video.Selfview.Mode.get().then(evalSelfView);

    // register to receive events when someone manually turns on self-view
    // so we can keep the custom toggle button in the right state
    xapi.Status.Video.Selfview.Mode.on(evalSelfView);

    // register to receive events when someone manually turns on full screen mode
    // so we can keep the custom toggle button in the right state if also in self view
    xapi.Status.Video.Selfview.FullscreenMode.on(evalFullScreenEvent);

    // next, set Automatic mode toggle switch on custom panel off since the macro starts that way
    xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_override', Value: 'off'});

    // next, set side by side mode panel to whatever is configured initially
    xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_sbs_control', Value: (perma_sbs) ? 'on' : 'off'});

    

}


/////////////////////////////////////////////////////////////////////////////////////////
// START/STOP AUTOMATION FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

async function startAutomation() {
  console.log('startAutomation');
   //setting overall manual mode to false
   manual_mode = false;
   allowCameraSwitching = true;

   if (isOSEleven) {
   try {
    const webViewType = await xapi.Status.UserInterface.WebView.Type.get()
    if (webViewType=='WebRTCMeeting') webrtc_mode=true;
   } catch (e) {
     console.log('Unable to read WebView Type.. assuming not in webrtc mode')
   }
  }

    // Always turn on SpeakerTrack when the Automation is started. It is also turned on when a call connects so that
    // if it is manually turned off while outside of a call it goes back to the correct state
   if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);

   //registering vuMeter event handler
   micHandler=xapi.event.on('Audio Input Connectors Microphone', (event) => {
    //adding protection for mis-configured mics
    if (typeof micArrays[event.id[0]]!='undefined') { 
        micArrays[event.id[0]].pop();
        micArrays[event.id[0]].push(event.VuMeter);

        // checking on manual_mode might be unnecessary because in manual mode,
        // audio events should not be triggered
        if (manual_mode==false)
        {
            // invoke main logic to check mic levels ans switch to correct camera input
            checkMicLevelsToSwitchCamera();
        }
      }
    });
  // start VuMeter monitoring
  console.log("Turning on VuMeter monitoring...")
  for (var i in MICROPHONE_CONNECTORS) {
    xapi.command('Audio VuMeter Start', {
          ConnectorId: MICROPHONE_CONNECTORS[i],
          ConnectorType: 'Microphone',
          IntervalMs: 500,
          Source: 'AfterAEC'
    });
  }
  // set toggle button on custom panel to reflect that automation is turned on.
  xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_override', Value: 'on'});
}

function stopAutomation() {
         //setting overall manual mode to true
         manual_mode = true;
         stopSideBySideTimer();
         stopNewSpeakerTimer();
         stopInitialCallTimer();
         console.log("Stopping all VuMeters...");
         xapi.Command.Audio.VuMeter.StopAll({ });
         //TODO: check to see if when we stop automation we really want to switch to connectorID 1
         console.log("Switching to MainVideoSource connectorID 1 ...");
         xapi.Command.Video.Input.SetMainVideoSource({ SourceId: 1});
         // using proper way to de-register handlers
         micHandler();
         micHandler= () => void 0;

         // set toggle button on custom panel to reflect that automation is turned off.
         xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_override', Value: 'off'});

}

/////////////////////////////////////////////////////////////////////////////////////////
// MICROPHONE DETECTION AND CAMERA SWITCHING LOGIC FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function checkMicLevelsToSwitchCamera() {
  // make sure we've gotten enough samples from each mic in order to do averages
  if (allowCameraSwitching) {
         // figure out which of the inputs has the highest average level then perform logic for that input *ONLY* if allowCameraSwitching is true
          let array_key=largestMicValue();
          let array=[];
          array=micArrays[array_key];
          // get the average level for the currently active input
          let average = averageArray(array);
          //get the input number as an int since it is passed as a string (since it is a key to a dict)
          let input = parseInt(array_key);
          // someone is speaking
          if (average > MICROPHONEHIGH) {
            // start timer to prevent Side-by-Side mode too quickly
            restartSideBySideTimer();
            if (input > 0) {
              lowWasRecalled = false;
              // no one was talking before
              if (lastActiveHighInput === 0) {
                makeCameraSwitch(input, average);
              }
              // the same person is talking
              else if (lastActiveHighInput === input) {
                restartNewSpeakerTimer();
              }
              // a different person is talking
              else if (lastActiveHighInput !== input) {
                if (allowNewSpeaker) {
                  makeCameraSwitch(input, average);
                }
              }
            }
          }
          // no one is speaking
          else if (average < MICROPHONELOW) {
            // only trigger if enough time has elapsed since someone spoke last
            if (allowSideBySide) {
              if (input > 0 && !lowWasRecalled) {
                lastActiveHighInput = 0;
                lowWasRecalled = true;
                console.log("-------------------------------------------------");
                console.log("Low Triggered");
                console.log("-------------------------------------------------");
                recallSideBySideMode();
              }
            }
          }

  }
}

// function to actually switch the camera input
async function makeCameraSwitch(input, average) {
  console.log("-------------------------------------------------");
  console.log("High Triggered: ");
  console.log(`Input = ${input} | Average = ${average}`);
  console.log("-------------------------------------------------");

  // first obtain the Map Camera Sources value that corresponds to the loudest microphone
  // we want to use for switching camera input
  var selectedSource=MAP_CAMERA_SOURCES[MICROPHONE_CONNECTORS.indexOf(input)]

  if (!perma_sbs) {
// We do not need to check for  has_SpeakerTrack below because we are implicitly
// checking for that by evaluating typeof selectedSource
  if (typeof selectedSource == 'number') {
    if (selectedSource==SP) {
        // if the active camera is a SpeakerTrack camera, just activate it, no need to set main video source to it
        console.log('Switching to SpeakerTrack camera');
        xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
    }
    else {
          // the Video Input SetMainVideoSource does not work while Speakertrack is active
          // so we need to turn it off in case the previous video input was from a source where
          // SpeakerTrack is used.
          xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
           // Switch to the source that is speficied in the same index position in MAP_CAMERA_SOURCE_IDS
          let sourceDict={ SourceID : '0'}
          sourceDict["SourceID"]=selectedSource.toString();
          console.log("Switching to input with SetMainVideoSource with dict: ", sourceDict  )
          xapi.command('Video Input SetMainVideoSource', sourceDict).catch(handleError);
          if ((MAP_CAMERA_SOURCES.indexOf(SP)==-1) && (selectedSource==MAIN_CODEC_QUADCAM_SOURCE_ID) ) {
              // if the codec is using a QuadCam (no SpeakerTrack camera allowed) then
              // turn back on SpeakerTrack function on the codec in case it was turned off in side by side mode.
              xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
          }
      }
      // if we are not switching to a camera zone with PTZ cameras, we need to re-set the
      // lastActivePTZCameraZone Object to the "non-camera" value of Z0 as when we started the macro
      // because the decision tree on switching or not from a camera that was already pointed at someone
      // relies on the last video input source having been a PTZ camera video zone
      lastActivePTZCameraZoneObj=Z0;
      lastActivePTZCameraZoneCamera='0';
    }
   else if (typeof selectedSource == 'object') {
        switchToVideoZone(selectedSource);
   }
  // send required messages to auxiliary codec that also turns on speakertrack over there
  await sendIntercodecMessage(AUX_CODEC, 'automatic_mode');

  } else {
    // if "permanent" side by side is selected, just switch to that
    console.log("Permanent side by side active when inside makeCameraSwitch()...")
    permaSideBySideMode(selectedSource);

  }
  lastActiveHighInput = input;
  restartNewSpeakerTimer();
}

async function switchToVideoZone(selectedSource) {
           // The mic input mapped to a PTZ camera is to be selected, first check that camera zone was already being used
            if (lastActivePTZCameraZoneObj==selectedSource) {
                // same camera zone as before, so we do not want to change the inUse value of that zone object (keep it inUse=true)
                console.log("Still using same camera zone, no need to Activate camera preset.")
            }
            else
            {
                var selectedSourcePrimaryCamID='';
                var selectedSourceSecondaryCamID='';
                var thePresetId=0;
                var thePresetVideoSource=0;
                // Since this is a camera zone,  first check if primary or secondary to be selected based on the possibility
                // that the previous zone was using the same physical camera than the new zone selected.
                selectedSourcePrimaryCamID = await getPresetCamera(selectedSource['primary']);
                if (selectedSourcePrimaryCamID!=lastActivePTZCameraZoneCamera) {
                    thePresetId=selectedSource['primary'];
                    thePresetVideoSource=MAP_PTZ_CAMERA_VIDEO_SOURCE_ID[selectedSourcePrimaryCamID]
                    lastActivePTZCameraZoneObj=selectedSource;
                    lastActivePTZCameraZoneCamera=selectedSourcePrimaryCamID;
                }
                else {
                    selectedSourceSecondaryCamID = await getPresetCamera(selectedSource['secondary']);
                    thePresetId=selectedSource['secondary'];
                    thePresetVideoSource=MAP_PTZ_CAMERA_VIDEO_SOURCE_ID[selectedSourceSecondaryCamID]
                    lastActivePTZCameraZoneObj=selectedSource;
                    lastActivePTZCameraZoneCamera=selectedSourceSecondaryCamID;

                }
                // instruct the codec to now use the correct camera preset
                console.log('Switching to preset ID: '+thePresetId+' which uses camera: '+lastActivePTZCameraZoneCamera);
                xapi.Command.Camera.Preset.Activate({ PresetId: thePresetId });

                // now set main video source to where the camera is connected
                setTimeout(function() {
                            setMainVideoSource(thePresetVideoSource);
                            }, VIDEO_SOURCE_SWITCH_WAIT_TIME);

            }

}

function setMainVideoSource(thePresetVideoSource) {
    // the Video Input SetMainVideoSource does not work while Speakertrack is active
    // so we need to turn it off in case the previous video input was from a source where
    // SpeakerTrack is used.
    if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);

    let sourceDict={ SourceID : '0'}
    sourceDict["SourceID"]=thePresetVideoSource.toString();
    console.log("In setMainVideoSource() switching to input with SetMainVideoSource with dict: ", sourceDict  )
    xapi.command('Video Input SetMainVideoSource', sourceDict).catch(handleError);
}

function largestMicValue() {
  // figure out which of the inputs has the highest average level and return the corresponding key
 let currentMaxValue=0;
 let currentMaxKey='';
 let theAverage=0;
 for (var i in MICROPHONE_CONNECTORS){
    theAverage=averageArray(micArrays[MICROPHONE_CONNECTORS[i].toString()]);
    if (theAverage>=currentMaxValue) {
        currentMaxKey=MICROPHONE_CONNECTORS[i].toString();
        currentMaxValue=theAverage;
    }
 }
 return currentMaxKey;
}

function averageArray(arrayIn) {
  let sum = 0;
  for(var i = 0; i < arrayIn.length; i++) {
    sum = sum + parseInt( arrayIn[i], 10 );
  }
  let avg = (sum / arrayIn.length) * arrayIn.length;
  return avg;
}

async function recallSideBySideMode() {
  //first we need to clear out the lastActivePTZCameraZone vars since we want to make sure
  // that after SideBySideMode is called, the next call to switchToVideoZone() does actually force
  // a switch
  lastActivePTZCameraZoneObj=Z0;
  lastActivePTZCameraZoneCamera='0';
  if (overviewShowDouble && !webrtc_mode) { //WebRTC mode does not support composing yet even in RoomOS11
        let connectorDict={ ConnectorId : [0,0]};
        connectorDict["ConnectorId"]=OVERVIEW_DOUBLE_SOURCE_IDS;
        console.log("Trying to use this for connector dict in recallSideBySideMode(): ", connectorDict  )
        xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);
        if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
        xapi.command('Camera Preset Activate', { PresetId: 30 }).catch(handleError);

        const payload = { EditMatrixOutput: { sources: connectorDict["ConnectorId"] } };

        setTimeout(function(){
          //Let USB Macro know we are composing
          localCallout.command(payload).post()
        }, 250) //250ms delay to allow the main source to resolve first
    }
    else {
        // Check for OVERVIEW_PRESET_ZONE. If set to default Z0, just SetMainVideoSource
        if (OVERVIEW_PRESET_ZONE == Z0) {
            let sourceDict={ SourceID : '0'};
            sourceDict["SourceID"]=OVERVIEW_SINGLE_SOURCE_ID.toString();
            console.log("Trying to use this for source dict in recallSideBySideMode(): ", sourceDict  )
            xapi.command('Video Input SetMainVideoSource', sourceDict).catch(handleError);
            if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
        }
        else {
                // If OVERVIEW_PRESET_ZONE is defined as something other than Z0, switch to that
                console.log('Recall side by side mode switching to preset OVERVIEW_PRESET_ZONE...');
                if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
                switchToVideoZone(OVERVIEW_PRESET_ZONE);
        }
    }
  // send required messages to other codecs
  await sendIntercodecMessage(AUX_CODEC, 'side_by_side');
  lastActiveHighInput = 0;
  lowWasRecalled = true;
}


async function permaSideBySideMode(selectedSource) {

  if (overviewShowDouble && !webrtc_mode) { //WebRTC mode does not support composing yet even in RoomOS11
        let connectorDict={ ConnectorId : [0,0]};
        connectorDict["ConnectorId"]=OVERVIEW_DOUBLE_SOURCE_IDS;
        console.log("Trying to use this for connector dict in permaSideBySideMode(): ", connectorDict  )
        xapi.command('Video Input SetMainVideoSource', connectorDict).catch(handleError);

        if (MAIN_CODEC_QUADCAM_SOURCE_ID==selectedSource) {
          await sendIntercodecMessage(AUX_CODEC, 'side_by_side');
          if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
        } else {
          await sendIntercodecMessage(AUX_CODEC, 'automatic_mode');
          if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Deactivate').catch(handleError);
          xapi.command('Camera Preset Activate', { PresetId: 30 }).catch(handleError);        
        }

        const payload = { EditMatrixOutput: { sources: connectorDict["ConnectorId"] } };

        setTimeout(function(){
          //Let USB Macro know we are composing
          localCallout.command(payload).post()
        }, 250) //250ms delay to allow the main source to resolve first
    }
    else {
        console.log('Cannot set permanent side by side mode without overviewShowDouble set to true or in WebRTC mode... ');
        perma_sbs=false;
        xapi.command('UserInterface Extensions Widget SetValue', {WidgetId: 'widget_sbs_control', Value: (perma_sbs) ? 'on' : 'off'});
    }

}

/////////////////////////////////////////////////////////////////////////////////////////
// TOUCH 10 UI FUNCTION HANDLERS
/////////////////////////////////////////////////////////////////////////////////////////

function handleOverrideWidget(event)
{
         if (event.WidgetId === 'widget_override')
         {
            console.log("Camera Control button selected.....")
            if (event.Value === 'off') {

                    console.log("Camera Control is set to Manual...");
                    console.log("Stopping automation...")
                    stopAutomation();
                }
               else
               {

                  // start VuMeter monitoring
                  console.log("Camera Control is set to Automatic...");
                  console.log("Starting automation...")
                  startAutomation();
               }

         }
         
         if (event.WidgetId === 'widget_sbs_control')
         {
            console.log("Side by side control selected.....")
            if (event.Value === 'off') {
                  console.log("Side by side control is set to overview...");
                  perma_sbs=false;
                }
               else
               {
                  console.log("Side by side control is set to always...");
                  perma_sbs=true;
                }
            // trigger a cameraSwitch evaluation
            lastActiveHighInput = 0;
         }

         if (event.WidgetId === 'widget_FS_selfview')
         {
            console.log("Selfview button selected.....")
            if (event.Value === 'off') {
                    console.log("Selfview is set to Off...");
                    console.log("turning off self-view...")
                    xapi.Command.Video.Selfview.Set({ FullscreenMode: 'Off', Mode: 'Off', OnMonitorRole: 'First'});
                }
               else
               {
                  console.log("Selfview is set to On...");
                  console.log("turning on self-view...")
                  // TODO: determine if turning off self-view should also turn off fullscreenmode
                  xapi.Command.Video.Selfview.Set({ FullscreenMode: 'On', Mode: 'On', OnMonitorRole: 'First'});
               }
         }
}


/////////////////////////////////////////////////////////////////////////////////////////
// ERROR HANDLING
/////////////////////////////////////////////////////////////////////////////////////////

function handleError(error) {
  console.log(error);
}


/////////////////////////////////////////////////////////////////////////////////////////
// INTER-MACRO MESSAGE HANDLING
/////////////////////////////////////////////////////////////////////////////////////////

async function updateUSBModeConfig() {
  var object = { AlterUSBConfig: { config: 'matrix_Camera_Mode', value: true } } 
  await localCallout.command(object).post() 
}


GMM.Event.Receiver.on(event => {
  const usb_mode_reg = /USB_Mode_Version_[0-9]*.*/gm
  if ((typeof event)!='string')
  if (event.Source.Id=='localhost') {
          // we are evaluating a local event, first check to see if from the USB Mode macro
          if (usb_mode_reg.test(event.App)) {
            if (event.Type == 'Error') {
              console.error(event)
            } else {
                switch (event.Value) {
                  case 'Initialized':
                    console.warn(`USB mode initialized...`)
                    updateUSBModeConfig();
                    break;
                  case 'EnteringWebexMode':
                    console.warn(`You are entering Webex Mode`)
                    //Run code here when Default Mode starts to configure
                    break;
                  case 'WebexModeStarted':
                    console.warn(`System is in Default Mode`)
                    stopAutomation();
                    usb_mode= false;
                    // always tell the other codec when your are in or out of a call
                    //otherCodec.status('CALL_DISCONNECTED').post();

                    break;
                  case 'enteringUSBMode':
                    console.warn(`You are entering USB Mode`)
                    //Run code here when USB Mode starts to configure
                    break;
                  case 'USBModeStarted':
                    console.warn(`System is in Default Mode`)
                    startAutomation();
                    usb_mode= true;
                    // always tell the other codec when your are in or out of a call
                    //otherCodec.status('CALL_CONNECTED').post();

                    break;
                  default:
                    break;
                }
            }
          }
          else {
            console.debug({
              Message: `Received Message from ${event.App} and was not processed`
            })
          }
        }


      })


/////////////////////////////////////////////////////////////////////////////////////////
// INTER-CODEC COMMUNICATION
/////////////////////////////////////////////////////////////////////////////////////////

async function sendIntercodecMessage(codec, message) {

  if (codec.enable) {
    console.log(`sendIntercodecMessage: codec = ${codec.url} | message = ${message}`);

    const parameters = {
      Url: `https://${codec.url}/putxml`,
      Header: ['Content-Type: text/xml', 'Authorization: Basic ' + codec.auth],
      AllowInsecureHTTPS: 'True'
    }

    const body = `<Command><Message><Send><Text>${message}</Text></Send></Message></Command>`;

    try {
      const request = await xapi.Command.HTTPClient.Post(parameters, body);
      console.log({ Message: `Success`, Payload: body, StatusCode: request.StatusCode, Status: request.status })
    } catch (e) {
      if ('data' in e) {
        console.error({ Error: e.message, StatusCode: e.data.StatusCode, Status: e.data.status })
      } else {
        console.error({ Error: e.message })
      }

      alertFailedIntercodecComm(`Error connecting to codec for second camera, please contact the Administrator`)
    }
 }
} 

function alertFailedIntercodecComm(message) {
        xapi.command("UserInterface Message Alert Display", {
        Text: message
      , Duration: 10
    }).catch((error) => { console.error(error); });
}

/////////////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONAL HANDLERS
/////////////////////////////////////////////////////////////////////////////////////////


function handleMicMuteOn() {
  console.log('handleMicMuteOn');
  lastActiveHighInput = 0;
  lowWasRecalled = true;
  recallSideBySideMode();
}

function handleMicMuteOff() {
  console.log('handleMicMuteOff');
  // need to turn back on SpeakerTrack that might have been turned off when going on mute
  if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
}

// ---------------------- MACROS


function handleMessage(event) {
  switch(event.Text) {
    case "VTC-1_OK":
      handleCodecOnline(AUX_CODEC);
      break;
  }
}

// function to check the satus of the macros running on the AUX codec
async function handleMacroStatus() {
  console.log('handleMacroStatus');
  if (AUX_CODEC.enable) {
      // reset tracker of responses from AUX codec
      AUX_CODEC.online = false;
      // send required messages to AUX codec
      await sendIntercodecMessage(AUX_CODEC, 'VTC-1_status');
  }
}

function handleCodecOnline(codec) {
    if (codec.enable) {
      console.log(`handleCodecOnline: codec = ${codec.url}`);
      codec.online = true;
  }
}

async function handleWakeUp() {
  console.log('handleWakeUp');
  // stop automatic switching behavior
  stopAutomation();
  // send wakeup to AUX codec
  await sendIntercodecMessage(AUX_CODEC, 'wake_up');
  // check the satus of the macros running on the AUX codec and store it in AUX_CODEC.online
  // in case we need to check it in some other function
  handleMacroStatus();
}

async function handleShutDown() {
  console.log('handleShutDown');
  // send required messages to other codecs
  await sendIntercodecMessage(AUX_CODEC, 'shut_down');
}

/////////////////////////////////////////////////////////////////////////////////////////
// VARIOUS TIMER HANDLER FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function startSideBySideTimer() {
  if (sideBySideTimer == null) {
    allowSideBySide = false;
    sideBySideTimer = setTimeout(onSideBySideTimerExpired, SIDE_BY_SIDE_TIME);
  }
}

function stopSideBySideTimer() {
  if (sideBySideTimer != null) {
    clearTimeout(sideBySideTimer);
    sideBySideTimer = null;
  }
}

function restartSideBySideTimer() {
  stopSideBySideTimer();
  startSideBySideTimer();
}

function onSideBySideTimerExpired() {
  console.log('onSideBySideTimerExpired');
  allowSideBySide = true;
  recallSideBySideMode();
}



function startInitialCallTimer() {
  if (InitialCallTimer == null) {
    allowCameraSwitching = false;
    InitialCallTimer = setTimeout(onInitialCallTimerExpired, INITIAL_CALL_TIME);
  }
}

function onInitialCallTimerExpired() {
  console.log('onInitialCallTimerExpired');
  InitialCallTimer=null;
  if (!manual_mode) {
    allowCameraSwitching = true;
    if (has_SpeakerTrack) xapi.command('Cameras SpeakerTrack Activate').catch(handleError);
  }
}

function stopInitialCallTimer() {
  if (InitialCallTimer != null) {
    clearTimeout(InitialCallTimer);
    InitialCallTimer = null;
  }
}

function startNewSpeakerTimer() {
  if (newSpeakerTimer == null) {
    allowNewSpeaker = false;
    newSpeakerTimer = setTimeout(onNewSpeakerTimerExpired, NEW_SPEAKER_TIME);
  }
}

function stopNewSpeakerTimer() {
  if (newSpeakerTimer != null) {
    clearTimeout(newSpeakerTimer);
    newSpeakerTimer = null;
  }
}

function restartNewSpeakerTimer() {
  stopNewSpeakerTimer();
  startNewSpeakerTimer();
}

function onNewSpeakerTimerExpired() {
  allowNewSpeaker = true;
}

/////////////////////////////////////////////////////////////////////////////////////////
// INVOCATION OF INIT() TO START THE MACRO
/////////////////////////////////////////////////////////////////////////////////////////

// if the Speakertrack Camera becomes available after FW upgrade, we must re-init so
// we register that action as an event handler
xapi.Status.Cameras.SpeakerTrack.Availability
    .on((value) => {
        console.log("Event received for SpeakerTrack Availability: ",value)
        if (value=="Available"){
         stopAutomation();
         init();
        }
    });


init();