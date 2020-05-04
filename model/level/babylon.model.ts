import * as BABYLON from 'babylonjs';
import { Vector3, Light, IShadowLight } from 'babylonjs';
import 'babylonjs-loaders';
import cubeTestGltf from './gltf/cube-test.gltf';
import { CustomCameraKeyboardInput } from './babylon-input.model';

export const babylonEngineParams: BABYLON.EngineOptions = {
  preserveDrawingBuffer: true,
  stencil: true,
  // antialias: true,
};

export async function loadSceneFromGtlf(
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement,
) {
  BABYLON.SceneLoader.ShowLoadingScreen = false;
  try {
    const scene = await BABYLON.SceneLoader.LoadAsync('', `data:${cubeTestGltf}`, engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    const ground = scene.getMeshByName('ground');
    if (ground) {
      ground.receiveShadows = true;
    }
    // const walls = scene.meshes.filter(m => m.material?.name === 'white');

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
          // shadowGenerator.forceBackFacesOnly = true;
          shadowGenerator.bias = 0.00001;
          const shadowMap = shadowGenerator.getShadowMap()!;
          // walls.forEach(mesh => shadowMap.renderList!.push(mesh));
          scene.meshes.forEach(mesh => shadowMap.renderList!.push(mesh));
          shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
          break;
        }
        case Light.LIGHTTYPEID_POINTLIGHT: {
          break;
        }
      }
    });


    const camera = new BABYLON.UniversalCamera('uni-cam', new Vector3(0, 10, 0), scene);
    camera.setTarget(Vector3.Zero());
    camera.minZ = 0;
    camera.attachControl(canvas);

    setInputs(camera);

    return scene;
  } catch (error) {
    console.log({ error });
    return new BABYLON.Scene(engine);
  }
}

function setInputs(camera: BABYLON.UniversalCamera) {
  camera.inputs.removeMouse();
  camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
  camera.inputs.add(new CustomCameraKeyboardInput(camera));
  // TODO add zoom
}
