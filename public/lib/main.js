"use strict";

var _objectHandler = _interopRequireDefault(require("./objectHandler.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var ARStates = {
  pre: 0,
  waitForPlace: 1,
  placed: 2
};
var currentState = ARStates.pre;
var debugMode = false;
var scene, camera, renderer;
var xrButton = document.getElementById('start_button');
var xrSession = null;
var xrRefSpace = null;
var overlayElement = document.getElementById("overlay");
var debugButton = document.getElementById("debug");

// WebGL scene globals.
var gl = null;
var objectHandler;
function checkSupportedState() {
  console.log("Log");
  document.getElementById("warning-zone").innerText = "Fine";
  navigator.xr.isSessionSupported('immersive-ar').then(function (supported) {
    if (supported) {
      xrButton.innerHTML = 'Enter AR';
    } else {
      xrButton.innerHTML = 'AR not found';
    }
    xrButton.disabled = !supported;
  });
}
function activateXR() {
  document.getElementById("warning-zone").innerText = "Change";
  console.log("Activating XR");
  checkSupportedState();
  if (!window.isSecureContext) {
    var message = "WebXR unavailable due to insecure context";
    document.getElementById("warning-zone").innerText = message;
  }
  if (navigator.xr) {
    xrButton.addEventListener('click', onButtonClicked);
    navigator.xr.addEventListener('devicechange', checkSupportedState);
    debugButton.addEventListener('click', enableDebug);
    document.getElementById("warning-zone").innerText = "Fine";
  } else {
    document.getElementById("warning-zone").innerText = "Navigator is not XR";
  }
}
function onButtonClicked() {
  if (!xrSession) {
    // Ask for an optional DOM Overlay, see https://immersive-web.github.io/dom-overlays/
    navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: {
        root: document.getElementById('overlay')
      }
    }).then(onSessionStarted, onRequestSessionError);
  } else {
    xrSession.end();
  }
}
function onSessionStarted(session) {
  xrSession = session;
  xrButton.innerHTML = 'Exit AR';
  overlayElement.style.justifyContent = "normal";
  debugButton.style.visibility = "visible";
  session.addEventListener('end', onSessionEnded);
  var canvas = document.createElement('canvas');
  gl = canvas.getContext('webgl', {
    xrCompatible: true
  });
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl)
  });
  session.requestReferenceSpace('local').then(function (refSpace) {
    xrRefSpace = refSpace;
    session.requestAnimationFrame(onXRFrame);
  });
  objectHandler = new _objectHandler["default"](session, canvas, gl);
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function onXRFrame(t, frame) {
  var session = frame.session;
  session.requestAnimationFrame(onXRFrame);
  gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
  objectHandler.render();
}
function onRequestSessionError(ex) {
  alert("Failed to start immersive AR session.");
  console.error(ex.message);
}
function onEndSession(session) {
  session.end();
}
function onSessionEnded(event) {
  xrSession = null;
  xrButton.innerHTML = 'Enter AR';
  overlayElement.style.justifyContent = "center";
  debugButton.style.visibility = "hidden";
  gl = null;
}
function enableDebug() {
  debugMode = !debugMode;
  console.log("Debug mode: " + debugMode);
}
activateXR();