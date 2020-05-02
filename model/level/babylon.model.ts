import * as BABYLON from 'babylonjs';
import { Vector3 } from 'babylonjs';

export function createDemoScene(canvas: HTMLCanvasElement, engine: BABYLON.Engine): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.FreeCamera('freecam-1', new Vector3(0, 5, -10), scene);
  camera.setTarget(Vector3.ZeroReadOnly);
  camera.attachControl(canvas);

  const _light = new BABYLON.HemisphericLight('light-1', Vector3.UpReadOnly, scene);
  const sphere = BABYLON.Mesh.CreateSphere('sphere-1', 16, 2, undefined, false, BABYLON.Mesh.FRONTSIDE);
  sphere.position.y = 1;
  const ground = BABYLON.Mesh.CreateGround('ground-1', 6, 6, 2, undefined, false);
  scene.addMesh(sphere);
  scene.addMesh(ground);

  return scene;
}
