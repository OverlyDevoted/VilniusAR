"use strict";

var renderer = null;
var scene = null;
var camera = null;
var model = null;
var mixer = null;
var action = null;
var reticle = null;
var lastFrame = Date.now();
var initScene = function initScene(gl, session) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // load our gltf model
  var loader = new GLTFLoader();
  loader.load('models/wheel.glb', function (gltf) {
    model = gltf.scene;
    model.scale.set(0.1, 0.1, 0.1);
    model.castShadow = true;
    model.receiveShadow = true;
    mixer = new THREE.AnimationMixer(model);
    action = mixer.clipAction(gltf.animations[0]);
    action.setLoop(THREE.LoopRepeat, 0);
  }, function () {}, function (error) {
    return console.error(error);
  });
  var light = new THREE.PointLight(0xffffff, 2, 100); // soft white light
  light.position.z = 1;
  light.position.y = 5;
  scene.add(light);

  // create and configure three.js renderer with XR support
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    autoClear: true,
    context: gl
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  renderer.xr.setSession(session);

  // simple sprite to indicate detected surfaces
  reticle = new THREE.Mesh(new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({
    color: 0x0fff00
  }));
  // we will update it's matrix later using WebXR hit test pose matrix
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
};

// button to start XR experience
var xrButton = document.getElementById('xr-button');
// to display debug information
var info = document.getElementById('info');
// to control the xr session
var xrSession = null;
// reference space used within an application https://developer.mozilla.org/en-US/docs/Web/API/XRSession/requestReferenceSpace
var xrRefSpace = null;
// for hit testing with detected surfaces
var xrHitTestSource = null;

// Canvas OpenGL context used for rendering
var gl = null;
function checkXR() {
  if (!window.isSecureContext) {
    document.getElementById("warning").innerText = "WebXR unavailable. Please use secure context";
  }
  if (navigator.xr) {
    navigator.xr.addEventListener('devicechange', checkSupportedState);
    checkSupportedState();
  } else {
    document.getElementById("warning").innerText = "WebXR unavailable for this browser";
  }
}
function checkSupportedState() {
  navigator.xr.isSessionSupported('immersive-ar').then(function (supported) {
    if (supported) {
      xrButton.innerHTML = 'Enter AR';
      xrButton.addEventListener('click', onButtonClicked);
    } else {
      xrButton.innerHTML = 'AR not found';
    }
    xrButton.disabled = !supported;
  });
}
function onButtonClicked() {
  if (!xrSession) {
    navigator.xr.requestSession('immersive-ar', {
      optionalFeatures: ['dom-overlay'],
      requiredFeatures: ['local', 'hit-test'],
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

  // Show which type of DOM Overlay got enabled (if any)
  if (session.domOverlayState) {
    info.innerHTML = 'DOM Overlay type: ' + session.domOverlayState.type;
  }

  // create a canvas element and WebGL context for rendering
  session.addEventListener('end', onSessionEnded);
  var canvas = document.createElement('canvas');
  gl = canvas.getContext('webgl', {
    xrCompatible: true
  });
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl)
  });

  // here we ask for viewer reference space, since we will be casting a ray
  // from a viewer towards a detected surface. The results of ray and surface intersection
  // will be obtained via xrHitTestSource variable
  session.requestReferenceSpace('viewer').then(function (refSpace) {
    session.requestHitTestSource({
      space: refSpace
    }).then(function (hitTestSource) {
      xrHitTestSource = hitTestSource;
    });
  });
  session.requestReferenceSpace('local').then(function (refSpace) {
    xrRefSpace = refSpace;
    session.requestAnimationFrame(onXRFrame);
  });
  document.getElementById("overlay").addEventListener('click', placeObject);

  // initialize three.js scene
  initScene(gl, session);
}
function onRequestSessionError(ex) {
  info.innerHTML = "Failed to start AR session.";
  console.error(ex.message);
}
function onSessionEnded(event) {
  xrSession = null;
  xrButton.innerHTML = 'Enter AR';
  info.innerHTML = '';
  gl = null;
  if (xrHitTestSource) xrHitTestSource.cancel();
  xrHitTestSource = null;
}
function placeObject() {
  if (reticle.visible && model) {
    reticle.visible = false;
    xrHitTestSource.cancel();
    xrHitTestSource = null;
    // we'll be placing our object right where the reticle was
    var pos = reticle.getWorldPosition();
    scene.remove(reticle);
    model.position.set(pos.x, pos.y, pos.z);
    scene.add(model);

    // start object animation right away
    toggleAnimation();
    // instead of placing an object we will just toggle animation state
    document.getElementById("overlay").removeEventListener('click', placeObject);
    document.getElementById("overlay").addEventListener('click', toggleAnimation);
  }
}
function toggleAnimation() {
  if (action.isRunning()) {
    action.stop();
    action.reset();
  } else {
    action.play();
  }
}

// Utility function to update animated objects
function updateAnimation() {
  var dt = (Date.now() - lastFrame) / 1000;
  lastFrame = Date.now();
  if (mixer) {
    mixer.update(dt);
  }
}
function onXRFrame(t, frame) {
  var session = frame.session;
  session.requestAnimationFrame(onXRFrame);
  if (xrHitTestSource) {
    // obtain hit test results by casting a ray from the center of device screen
    // into AR view. Results indicate that ray intersected with one or more detected surfaces
    var hitTestResults = frame.getHitTestResults(xrHitTestSource);
    if (hitTestResults.length) {
      // obtain a local pose at the intersection point
      var pose = hitTestResults[0].getPose(xrRefSpace);
      // place a reticle at the intersection point
      reticle.matrix.fromArray(pose.transform.matrix);
      reticle.visible = true;
    }
  } else {
    // do not show a reticle if no surfaces are intersected
    reticle.visible = false;
  }

  // update object animation
  updateAnimation();
  // bind our gl context that was created with WebXR to threejs renderer
  gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
  // render the scene
  renderer.render(scene, camera);
}
checkXR();