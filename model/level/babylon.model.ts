import * as BABYLON from 'babylonjs';
import { Vector3, Light, IShadowLight } from 'babylonjs';
import 'babylonjs-loaders';
import 'babylonjs-materials';
import { GridMaterial } from 'babylonjs-materials';
import shadowTest1Gltf from './gltf/shadow-test-1.gltf';
import { CustomCameraKeyboardInput } from './babylon-input.model';
import { Vector2 } from '@model/vec2.model';

export const babylonEngineParams: BABYLON.EngineOptions = {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
};

export function loadInitialScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
  const scene = new BABYLON.Scene(engine);
  const sun = new BABYLON.HemisphericLight('sun', new BABYLON.Vector3(1, 1, 0), scene);
  sun.intensity = 0.5;

  const spotlight = new BABYLON.SpotLight('spotlight', new BABYLON.Vector3(0, 10, 0), BABYLON.Vector3.Down(), Math.PI/2, 10, scene);
  spotlight.intensity *= 0.2;
  // const shadowGenerator = new BABYLON.ShadowGenerator(1024, spotlight);
  // shadowGenerator.bias = 0.00001; // Important
  // const shadowMap = shadowGenerator.getShadowMap()!;
  // scene.meshes.forEach(mesh => shadowMap.renderList!.push(mesh));
  // shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

  setupCamera(canvas, scene);

  const gridMaterial = new GridMaterial('grid-material', scene);
  gridMaterial.gridRatio = 0.5;
  gridMaterial.gridOffset = new BABYLON.Vector3(-0.5, 0, -0.5);
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
  gridMaterial.lineColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  
  const white = new BABYLON.BackgroundMaterial('white-material', scene);
  white.useRGBColor = false;
  white.primaryColor = new BABYLON.Color3(1, 1, 1);

  return scene;
}

function setupCamera(canvas: HTMLCanvasElement, scene: BABYLON.Scene) {
  const camera = new BABYLON.UniversalCamera('uni-cam', new Vector3(0, 20, 0), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.y += Math.PI; // So +x right, +z up
  camera.minZ = 0;
  camera.attachControl(canvas);
  camera.inputs.removeMouse();
  camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
  camera.inputs.add(new CustomCameraKeyboardInput(camera));
}

export function createTile(x: number, y: number, scene: BABYLON.Scene) {
  const ground = BABYLON.MeshBuilder.CreateGround(`tile-${x}-${y}`,{ width: 1, height: 1, subdivisions: 2 });
  ground.material = scene.getMaterialByName('grid-material');

  ground.position = new BABYLON.Vector3(x + 0.5, 0, y + 0.5);
  scene.addMesh(ground);
  return ground;
}

export function createWall(u: Vector2, v: Vector2, scene: BABYLON.Scene) {
  
  const delta = 0.05;
  const height = 5;
  const wall = BABYLON.MeshBuilder.CreateBox(`wall-${u}-${v}`, {
    height,
    width: Math.abs(v.x - u.x) + 2 * delta,
    depth: Math.abs(v.y - u.y) + 2 * delta,
  });
  // wall.receiveShadows = true;
  // wall.material = scene.getMaterialByName('gridMaterial');
  // wall.material = scene.getMaterialByName('white-material');

  wall.position = new BABYLON.Vector3(0.5 * (u.x + v.x), 0.5 * height, 0.5 * (u.y + v.y));
  scene.addMesh(wall);
  return wall;
}

export async function loadDemoScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
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
