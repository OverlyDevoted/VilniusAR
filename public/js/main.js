import ARScene from "./objectHandler.js";
const ARStates = {
    pre: 0,
    waitForPlace: 1,
    placed: 2
}

let currentState = ARStates.pre;
let debugMode = false;
let scene, camera, renderer;

let xrButton = document.getElementById('start_button');
let xrSession = null;
let xrRefSpace = null;
let overlayElement = document.getElementById("overlay");
let debugButton = document.getElementById("debug");

// WebGL scene globals.
let gl = null;
let objectHandler;

function checkSupportedState() {
    console.log("Log")
    document.getElementById("warning-zone").innerText = "Fine";
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
            xrButton.innerHTML = 'Enter AR';
        } else {
            xrButton.innerHTML = 'AR not found';
        }

        xrButton.disabled = !supported;
    });
}
function activateXR() {
    console.log("Activating XR")
    if (!window.isSecureContext) {
        let message = "WebXR unavailable due to insecure context";
        document.getElementById("warning-zone").innerText = message;
    }
    if (navigator.xr) {
        xrButton.addEventListener('click', onButtonClicked);
        navigator.xr.addEventListener('devicechange', checkSupportedState);
        checkSupportedState();
        debugButton.addEventListener('click', enableDebug)
        document.getElementById("warning-zone").innerText = "Fine";
    }
    else {
        document.getElementById("warning-zone").innerText = "Navigator is not XR";
    }
}

function onButtonClicked() {
    if (!xrSession) {
        // Ask for an optional DOM Overlay, see https://immersive-web.github.io/dom-overlays/
        navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.getElementById('overlay') }
        }).then(onSessionStarted, onRequestSessionError);
    } else {
        xrSession.end();
    }
}

function onSessionStarted(session) {
    xrSession = session;
    xrButton.innerHTML = 'Exit AR';
    overlayElement.style.justifyContent = "normal"
    debugButton.style.visibility = "visible";

    session.addEventListener('end', onSessionEnded);
    let canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl', {
        xrCompatible: true
    });
    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
    session.requestReferenceSpace('local').then((refSpace) => {
        xrRefSpace = refSpace;
        session.requestAnimationFrame(onXRFrame);
    });

    objectHandler = new ARScene(session, canvas, gl);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onXRFrame(t, frame) {
    let session = frame.session;
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
    overlayElement.style.justifyContent = "center"
    debugButton.style.visibility = "hidden";
    gl = null;
}

function enableDebug() {
    debugMode = !debugMode;
    console.log("Debug mode: " + debugMode);
}
activateXR();