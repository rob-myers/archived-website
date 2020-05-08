import * as BABYLON from 'babylonjs';

export class CustomCameraKeyboardInput implements BABYLON.ICameraInput<BABYLON.UniversalCamera> {

  public getSimpleName = () => 'keyboard';
  public getTypeName = () => 'FreeCameraKeyboardWalkInput';
  public getClassName = () => CustomCameraKeyboardInput.name;

  private keys = {} as Record<number, null>;
  private readonly keysUp = { 38: null, 87: null };
  private readonly keysDown = { 40: null, 83: null };
  private readonly keysLeft = { 37: null, 65: null };
  private readonly keysRight = { 39: null, 68: null };
  private _allowedKeys = {
    ...this.keysUp,
    ...this.keysDown,
    ...this.keysLeft,
    ...this.keysRight,
  };
  private _onLostFocus = () => this.keys = {};
  private _onKeyDown = null as null | ((e: KeyboardEvent) => void);
  private _onKeyUp = null as null | ((e: KeyboardEvent) => void);
  private delta = 0.05;

  constructor(public camera: BABYLON.UniversalCamera) {
    //
  }

  public attachControl(el: HTMLCanvasElement, noPreventDefault = false) {
    if (!this._onKeyDown) {
      el.tabIndex = 1;
      this._onKeyDown = (evt) => {
        if (evt.keyCode in this._allowedKeys) {
          this.keys[evt.keyCode] = null;
          if (!noPreventDefault) evt.preventDefault();
        }
      };
      this._onKeyUp = (evt) => {
        if (evt.keyCode in this._allowedKeys) {
          delete this.keys[evt.keyCode];
          if (!noPreventDefault) evt.preventDefault();
        }
      };
  
      el.addEventListener('keydown', this._onKeyDown, false);
      el.addEventListener('keyup', this._onKeyUp, false);
      BABYLON.Tools.RegisterTopRootEvents(
        window,
        [{ name: 'blur', handler: this._onLostFocus }],
      );
    }
  }

  public checkInputs () {
    if (this._onKeyDown) {
      const camera = this.camera;
      for (const keyCode in this.keys) {
        if (keyCode in this.keysLeft) {
          camera.position.x -= this.delta;
        } else if (keyCode in this.keysUp) {
          camera.position.z += this.delta;
        } else if (keyCode in this.keysRight) {
          camera.position.x += this.delta;
        } else if (keyCode in this.keysDown) {
          camera.position.z -= this.delta;
        }
      }
    }
  }

  public detachControl(el: HTMLCanvasElement) {
    if (this._onKeyDown && this._onKeyUp) {
      el.removeEventListener('keydown', this._onKeyDown);
      el.removeEventListener('keyup', this._onKeyUp);
      BABYLON.Tools.UnregisterTopRootEvents(
        window,
        [{ name: 'blur', handler: this._onLostFocus }]
      );
      this.keys = [];
      this._onKeyDown = null;
      this._onKeyUp = null;
    }
  }
}