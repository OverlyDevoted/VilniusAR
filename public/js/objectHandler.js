export default class ARScene {

    viewport;
    //scene objects
    placeMarker;
    poiMarker; // maybe its worth to add markers to marker group - needs testing
    //neeed to turn to group for text
    loadingText;
    loadingGroup;

    //loading counter variables
    load = 0;
    needToLoad = 0;


    constructor(session, canvas, gl) {
        console.log("creating THREE js handler");
        this.pointer = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.isMarkerLoaded = false;
        this.poiInf = [];
        this.loader = new THREE.GLTFLoader();
        this.addPoi(
            this.loader,
            "https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Rajonai/VGTU2.gltf",
            this.poiInf,
            new THREE.Vector3(1, 0, 0),
            0.45,
            new THREE.Vector3(0.1, 0.1, 0.1)
        );
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            preserveDrawingBuffer: true,
            canvas: canvas,
            context: gl
        });
        this.renderer.xr.setReferenceSpaceType("local");
        this.renderer.xr.setSession(session)
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
    
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera();
        
    
        this.camera.matrixAutoUpdate = false;
        this.addCube();
    }


    createPOI(scene) {
        //marker setup
        const texture = new THREE.TextureLoader().load('https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Icons/poi.png');
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00, map: texture });
        material.opacity = 1.0;
        poiMarker = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), material);
        poiMarker.position.set(0, 0, -1);
        //placeMarker.rotateOnAxis(new THREE.Vector3(-1.0,0.0,0.0), 3.14159/2);
    }
    addPoi(loader, url, poiInf, direction, magnitude, scale) {
        this.needToLoad++;
        let model;
        loader.load(url,
            function (gtlf) {
                try {
                    model = gtlf.scene;
                    console.log(url + " loaded. Increment");
                    poiInf.push({ model: model, pos: direction, scale: scale, magnitude: magnitude });
                }
                catch (error) {
                    console.log(error);
                }
            });
    }
    createLoading(scene, parent) {
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
    addCube()
    {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
        const cube = new THREE.Mesh( geometry, material ); 
        cube.scale.set(0.1,0.1,0.1);
        this.scene.add( cube ); 
    }
    incrementLoad() {
        load++;
        console.log(load + "/" + needToLoad);
        try {
            loadingText.text = "Loading " + load + "/" + "needToLoad";
        }
        catch (error) {
            console.log(error);
        }
    }
    render(){
        this.renderer.render(this.scene, this.camera);
    }
}