const ARStates = {
    pre: 0,
    waitForPlace: 1,
    placed: 2
}

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let viewport;

let currentState = ARStates.pre;
let debugMode = false;
let isAspectSet = false;

//scene objects
let markerGroup; // parent of place marker
let placeMarker;
let poiMarker; // maybe its worth to add markers to marker group - needs testing
//neeed to turn to group for text
let loadingText;
let loadingGroup;
let isMarkerLoaded = false;
function enableDebug(enable) {
    debugMode = enable;
    console.log("Debug mode: " + debugMode);
}
let poiInf = [];

function createMarker(scene) {
    //marker setup
    const texture = new THREE.TextureLoader().load('https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Icons/fingerprint.png');
    const material = new THREE.MeshLambertMaterial({ map: texture });
    material.opacity = 1.0;
    material.color.set(0xffffff);
    placeMarker = new THREE.Mesh(new THREE.CircleGeometry(0.025, 32), material);

    markerGroup = new THREE.Group();
    markerGroup.visible = false;
    markerGroup.add(placeMarker);
    //placeMarker.position.set(0,0,-1);
    //placeMarker.rotateOnAxis(new THREE.Vector3(-1.0,0.0,0.0), 3.14159/4);
    scene.add(markerGroup)
}
function createPOI(scene) {
    //marker setup
    const texture = new THREE.TextureLoader().load('https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Icons/poi.png');
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00, map: texture });
    material.opacity = 1.0;
    poiMarker = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), material);
    poiMarker.position.set(0, 0, -1);
    //placeMarker.rotateOnAxis(new THREE.Vector3(-1.0,0.0,0.0), 3.14159/2);
}
function addPoi(loader, url, direction, magnitude, scale) {
    needToLoad++;
    let model;
    loader.load(url,
        function (gtlf) {
            model = gtlf.scene;
            console.log(url + " loaded");
            poiInf.push({ model: model, pos: direction, scale: scale, magnitude: magnitude });
            try {
                incrementLoad();
            }
            catch (error) {
                console.log(error);
            }
        });
}
function createLoading(scene, parent) {
    loadingGroup = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
    material.opacity = 0.5;
    const loadingBackground = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 16), material);
    loadingGroup.add(loadingBackground);

    const fontLoader = new THREE.FontLoader();
    fontLoader.load('https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Fonts/Roboto_Bold.json', function (font) {
        const geometry = new THREE.TextGeometry('Loading', {
            font: font,
            size: 0.1,
            height: 0.01,
        })
        loadingText = new THREE.Mesh(geometry, [
            new THREE.MeshBasicMaterial({ color: 0xffffff }),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        ]);
        loadingText.position.set(-0.225, 0, -1);
        loadingGroup.add(loadingText);
        scene.add(loadingGroup);
    });
}

//loading counter variables
let load = 0;
let needToLoad = 0;
function incrementLoad() {
    load++;
    console.log(load + "/" + needToLoad);
    try {
        loadingText.text = "Loading " + load + "/" + "needToLoad";
    }
    catch (error) {
        console.log(error);
    }
}
let container;
let scene, camera, renderer;
let session;
async function activateXR() {


    // Add a container element and initialize a WebGL context that is compatible with WebXR.
    container = document.createElement("container");
    document.body.appendChild(container);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
    );

    const basicSphereGeometry = new THREE.SphereGeometry(0.5, 32, 16);
    const basicGaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const directionalLightDebug = new THREE.Mesh(basicSphereGeometry, basicGaterial);

    //scene lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(0, 5, 0);
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // soft white light

    directionalLight.add(ambientLight);
    directionalLight.add(directionalLightDebug);

    scene.add(directionalLight);

    //add map marker objects
    createMarker(scene);
    createPOI(scene);


    // Set up the WebGLRenderer, which handles rendering to the session's base layer.
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
    });
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // The API directly updates the camera matrices.
    // Disable matrix auto updates so three.js doesn't attempt
    // to handle the matrices independently.

    camera.matrixAutoUpdate = false;

    createLoading(scene, camera);
    const loader = new THREE.GLTFLoader();
    //REFACTOR: turn to function with direction relative to center, magnitude
    //model url as parameters, scale, 

    addPoi(
        loader,
        "https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Rajonai/VGTU2.gltf",
        new THREE.Vector3(1, 0, 1),
        0.5,
        new THREE.Vector3(0.1, 0.1, 0.1)
    );

    addPoi(
        loader,
        "https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Rajonai/PavilJonas.gltf",
        new THREE.Vector3(1, 0, -1),
        0.5,
        new THREE.Vector3(0.1, 0.1, 0.1)
    );

    // Initialize a WebXR session using "immersive-ar".
    session = await navigator.xr.requestSession("immersive-ar", { requiredFeatures: ['hit-test'] });

    renderer.xr.setReferenceSpaceType("local");
    renderer.xr.setSession(session);
    //setup raycaster
    raycaster.layers.set(1);

    //touch callback
    session.addEventListener("select", (event) => {
        var mouse3D = new THREE.Vector3(event.inputSource.gamepad.axes[0] * (1 - camera.aspect), -event.inputSource.gamepad.axes[1] * (1 + camera.aspect), 0.5);
        const cameraOrigin = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
        const directionFromCamera = camera.getWorldDirection(new THREE.Vector3());

        mouse3D.unproject(camera);
        mouse3D.sub(cameraOrigin)
        mouse3D.normalize();

        raycaster.set(cameraOrigin, mouse3D);
        var intersects = raycaster.intersectObjects(scene.children);

        if (debugMode) {
            scene.add(new THREE.ArrowHelper(directionFromCamera, cameraOrigin, 2, 0xff0000));
            scene.add(new THREE.ArrowHelper(mouse3D, cameraOrigin, 2, 0x00ff00));
        }
        switch (currentState) {
            case ARStates.pre: {
                if (debugMode)
                    console.log("Not loaded");
            }
            case ARStates.waitForPlace: {
                if (poiMarker) {
                    for (i = 0; i < poiInf.length; i++) {
                        const clone = poiMarker.clone();
                        scene.add(clone);
                        clone.position.copy(markerGroup.position);

                        clone.lookAt(new THREE.Vector3(cameraOrigin.x, clone.position.y, cameraOrigin.z));

                        clone.translateOnAxis(poiInf[i].pos, poiInf[i].magnitude);

                        poiInf[i].parent = clone;
                        const childClone = poiInf[i].model.clone();
                        childClone.position.copy(clone.position);
                        childClone.scale.copy(poiInf[i].scale);
                        childClone.visible = false;
                        poiInf[i].child = childClone;
                        scene.add(childClone);

                        clone.layers.enable(1);
                    }
                    currentState = ARStates.placed;
                }
            }
            case ARStates.placed: {
                for (var poi of intersects) {
                    for (i = 0; i < poiInf.length; i++) {
                        if (poiInf[i].parent == poi.object) {
                            poiInf[i].parent.visible = !poiInf[i].parent.visible;
                            poiInf[i].child.visible = !poiInf[i].child.visible;
                            return;
                        }
                    }
                }
            }
        }
    });

    
}
console.log("Script loaded");
function animate() {
    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {

    session.requestAnimationFrame(onXRFrame);

    // Bind the graphics framebuffer to the baseLayer's framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)

    // Retrieve the pose of the device.
    // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
    const pose = frame.getViewerPose(referenceSpace);

    //TODO: Cache some variables
    if (pose) {
        // In mobile AR, we only have one view.
        const view = pose.views[0];

        viewport = session.renderState.baseLayer.getViewport(view);
        //setup aspect ratio

        if (!isAspectSet) {
            camera.aspect = (viewport.width / viewport.height);
            //renderer.setSize(session.renderState.baseLayer.framebufferWidth, session.renderState.baseLayer.framebufferHeight);
            renderer.setSize(viewport.width, viewport.height)

            isAspectSet = true;
        }
        //console.log(new THREE.Vector2(viewport.width, viewport.height).multiplyScalar(1/window.devicePixelRatio));
        //renderer.setSize(viewport.width, viewport.height);
        // Use the view's transform matrix and projection matrix to configure the THREE.camera.
        camera.matrix.fromArray(view.transform.matrix)
        camera.projectionMatrix.fromArray(view.projectionMatrix);
        camera.updateMatrixWorld(true);
        loadingGroup.position.copy(camera.getWorldPosition(new THREE.Vector3()));

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0 && markerGroup) {
            console.log("HIT");
            const hitPose = hitTestResults[0].getPose(referenceSpace);
            if (!isMarkerLoaded) {
                incrementLoad();
                isMarkerLoaded = true;
            }
            //make so the place marker looks at the camera

            markerGroup.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z)
            markerGroup.updateMatrixWorld(true);
            let lookDir = camera.getWorldPosition(new THREE.Vector3());
            markerGroup.lookAt(lookDir);
            if (debugMode) {
                //marker face direction
                scene.add(new THREE.ArrowHelper(markerGroup.getWorldDirection(new THREE.Vector3), markerGroup.getWorldPosition(new THREE.Vector3()), 2, 0xf542ec));
                console.log(camera.getWorldPosition(new THREE.Vector3()));
            }

            try {
                if (poiInf[0].parent != undefined) {
                    for (i = 0; i < poiInf.length; i++) {
                        poiInf[i].parent.lookAt(lookDir);
                    }
                }
            }
            catch (error) {
                console.log(error);
            }

        }

        if (load == needToLoad) {
            console.log("Fully loaded");
            loadingGroup.visible = false;
            markerGroup.visible = true;
            currentState = ARStates.waitForPlace;
            load++;
        }
    }
    renderer.render(scene, camera);
}
document.querySelector("#start_button").onclick = function tempName() {
    console.log("Activate XR");
    activateXR();
    animate();
};