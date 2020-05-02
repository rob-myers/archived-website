import * as BABYLON from 'babylonjs';
import { Vector3 } from 'babylonjs';

export function createDemoScene(canvas: HTMLCanvasElement, engine: BABYLON.Engine): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  const camera = new BABYLON.FreeCamera('freecam-1', new Vector3(0, 5, -10), scene);
  camera.setTarget(Vector3.ZeroReadOnly);
  camera.attachControl(canvas);

  const hemiLight = new BABYLON.HemisphericLight('light-1', Vector3.UpReadOnly, scene);
  const pointLight = new BABYLON.PointLight('light-2', Vector3.FromArray([0, 5, 0]), scene, );
  pointLight.intensity = 0.4;
  hemiLight.intensity = 0.4;

  const sphere = BABYLON.Mesh.CreateSphere('sphere-1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
  sphere.position.y = 1;

  const cube = BABYLON.MeshBuilder.CreateBox('box-1', { width: 1,  height: 1, depth: 1 }, scene);
  cube.position = new BABYLON.Vector3(0, 0, -5);

  const ground = BABYLON.Mesh.CreateGround('ground-1', 6, 6, 2, scene, false);
  const groundMaterial = new BABYLON.StandardMaterial('material-1', scene);
  groundMaterial.ambientColor = new BABYLON.Color3(1, 0, 0);
  ground.material = groundMaterial;

  return scene;
}
