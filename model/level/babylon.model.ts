import * as BABYLON from 'babylonjs';
import { Vector3, Light, IShadowLight } from 'babylonjs';
import 'babylonjs-loaders';
import shadowTest1Gltf from './gltf/shadow-test-1.gltf';
import { CustomCameraKeyboardInput } from './babylon-input.model';

export const babylonEngineParams: BABYLON.EngineOptions = {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
};

export function loadInitialScene(
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement,
) {
  const scene = new BABYLON.Scene(engine);
  const sun = new BABYLON.HemisphericLight('sun', new BABYLON.Vector3(1, 1, 0), scene);
  sun.intensity = 0.5;

  const spotlight = new BABYLON.SpotLight('spotlight', new BABYLON.Vector3(0, 10, 0), BABYLON.Vector3.Down(), Math.PI/2, 10, scene);
  spotlight.intensity *= 0.2;

  createTile(0, 0, scene);
  createTile(1, 0, scene);
  createTile(0, 1, scene);
  
  setupCamera(canvas, scene);
  
  return scene;
}

export async function loadDemoSceneFromGtlf(
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement,
) {
  BABYLON.SceneLoader.ShowLoadingScreen = false;
  try {
    const scene = await BABYLON.SceneLoader.LoadAsync('', `data:${shadowTest1Gltf}`, engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    const ground = scene.getMeshByName('ground');
    if (ground) {
      ground.receiveShadows = true;
    }

    scene.lights.forEach((light) => {
      switch (light.getTypeID()) {
        case Light.LIGHTTYPEID_DIRECTIONALLIGHT: {
          // light.intensity = 1;
          // light.specular = new BABYLON.Color3(1, 0, 0);
          // light.diffuse = new BABYLON.Color3(1, 0, 0);
          // const shadowGenerator = new BABYLON.ShadowGenerator(128, light as IShadowLight);
          // shadowGenerator.useBlurExponentialShadowMap = true;
          // scene.meshes.forEach(mesh => shadowGenerator.addShadowCaster(mesh));
          // shadowGenerator.getShadowMap()!.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
          break;
        }
        case Light.LIGHTTYPEID_SPOTLIGHT: {
          light.intensity *= 0.1;
          const shadowGenerator = new BABYLON.ShadowGenerator(1024, light as IShadowLight);
          shadowGenerator.bias = 0.00001; // Important
          const shadowMap = shadowGenerator.getShadowMap()!;
          scene.meshes.forEach(mesh => shadowMap.renderList!.push(mesh));
          shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
          break;
        }
        case Light.LIGHTTYPEID_POINTLIGHT: {
          break;
        }
      }
    });

    setupCamera(canvas, scene);

    return scene;
  } catch (error) {
    console.log({ error });
    return new BABYLON.Scene(engine);
  }
}

function setupCamera(
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
) {
  const camera = new BABYLON.UniversalCamera('uni-cam', new Vector3(0, 10, 0), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.y += Math.PI; // So +x right, +z up
  camera.minZ = 0;
  camera.attachControl(canvas);
  camera.inputs.removeMouse();
  camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
  camera.inputs.add(new CustomCameraKeyboardInput(camera));
}

function createTile(
  x: number,
  y: number,
  scene: BABYLON.Scene
) {
  const ground = BABYLON.MeshBuilder.CreateGround(`tile-${x}-${y}`,{ width: 1, height: 1 });
  ground.position = new BABYLON.Vector3(x + 0.5, 0, y + 0.5);
  // ground.enableEdgesRendering();    
  // ground.edgesWidth = 2.0;
  // ground.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
  scene.addMesh(ground);
}

function _createDebugMaterial(scene: BABYLON.Scene) {
  const red = new BABYLON.BackgroundMaterial('debug-material', scene);
  red.useRGBColor = false;
  red.primaryColor = new BABYLON.Color3(1, 0, 0);
  return red;
}
