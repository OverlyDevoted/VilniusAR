"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var ARScene = /*#__PURE__*/function () {
  function ARScene(session, canvas, gl) {
    _classCallCheck(this, ARScene);
    _defineProperty(this, "viewport", void 0);
    //scene objects
    _defineProperty(this, "placeMarker", void 0);
    _defineProperty(this, "poiMarker", void 0);
    // maybe its worth to add markers to marker group - needs testing
    //neeed to turn to group for text
    _defineProperty(this, "loadingText", void 0);
    _defineProperty(this, "loadingGroup", void 0);
    //loading counter variables
    _defineProperty(this, "load", 0);
    _defineProperty(this, "needToLoad", 0);
    console.log("creating THREE js handler");
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.isMarkerLoaded = false;
    this.poiInf = [];
    this.loader = new THREE.GLTFLoader();
    this.addPoi(this.loader, "https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Rajonai/PavilJonas.gltf", this.poiInf, new THREE.Vector3(1, 0, 0), 0.45, new THREE.Vector3(0.1, 0.1, 0.1));
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: canvas,
      context: gl
    });
    this.renderer.xr.setReferenceSpaceType("local");
    this.renderer.xr.setSession(session);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;
    this.addCube();
  }
  _createClass(ARScene, [{
    key: "createPOI",
    value: function createPOI(scene) {
      //marker setup
      var texture = new THREE.TextureLoader().load('https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Icons/poi.png');
      var material = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        map: texture
      });
      material.opacity = 1.0;
      poiMarker = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), material);
      poiMarker.position.set(0, 0, -1);
      //placeMarker.rotateOnAxis(new THREE.Vector3(-1.0,0.0,0.0), 3.14159/2);
    }
  }, {
    key: "addPoi",
    value: function addPoi(loader, url, poiInf, direction, magnitude, scale) {
      this.needToLoad++;
      var model;
      loader.load(url, function (gtlf) {
        try {
          model = gtlf.scene;
          console.log(url + " loaded. Increment");
          poiInf.push({
            model: model,
            pos: direction,
            scale: scale,
            magnitude: magnitude
          });
        } catch (error) {
          console.log(error);
        }
      });
    }
  }, {
    key: "createLoading",
    value: function createLoading(scene, parent) {
      loadingGroup = new THREE.Group();
      var material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
      });
      material.opacity = 0.5;
      var loadingBackground = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 16), material);
      loadingGroup.add(loadingBackground);
      var fontLoader = new THREE.FontLoader();
      fontLoader.load('https://cdn.statically.io/gh/OverlyDevoted/VilniusAR/pages/public/resources/Fonts/Roboto_Bold.json', function (font) {
        var geometry = new THREE.TextGeometry('Loading', {
          font: font,
          size: 0.1,
          height: 0.01
        });
        loadingText = new THREE.Mesh(geometry, [new THREE.MeshBasicMaterial({
          color: 0xffffff
        }), new THREE.MeshBasicMaterial({
          color: 0x000000
        })]);
        loadingText.position.set(-0.225, 0, -1);
        loadingGroup.add(loadingText);
        scene.add(loadingGroup);
      });
    }
  }, {
    key: "addCube",
    value: function addCube() {
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshBasicMaterial({
        color: 0x00ff00
      });
      var cube = new THREE.Mesh(geometry, material);
      cube.scale.set(0.1, 0.1, 0.1);
      this.scene.add(cube);
    }
  }, {
    key: "incrementLoad",
    value: function incrementLoad() {
      load++;
      console.log(load + "/" + needToLoad);
      try {
        loadingText.text = "Loading " + load + "/" + "needToLoad";
      } catch (error) {
        console.log(error);
      }
    }
  }, {
    key: "render",
    value: function render() {
      this.renderer.render(this.scene, this.camera);
    }
  }]);
  return ARScene;
}();
exports["default"] = ARScene;