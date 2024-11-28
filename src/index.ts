import * as fabric from 'fabric';

class CanvasHistory {
  private canvas: fabric.Canvas;
  private history: fabric.FabricObject[][];
  private historyRedo: fabric.FabricObject[][];
  private _isClearingCanvas: boolean;
  private _callback?: () => void;

  constructor(canvas: fabric.Canvas, changeCallback?: () => void) {
    this.canvas = canvas;
    this.history = [];
    this.historyRedo = [];
    this._isClearingCanvas = false; // Flag to avoid tracking during canvas clearing
    this._callback = changeCallback;
  }

  init() {
    this._enableEvents(); // track changes
    this._saveCanvasState(); // Save initial state
  }

  _saveCanvasState() {
    const jsonCanvas: fabric.FabricObject[] = structuredClone(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.canvas.toObject(['name', 'padding']).objects
    ) as fabric.FabricObject[];
    this.history.push(jsonCanvas);

    // set redo history to empty
    this.historyRedo = [];

    if (typeof this._callback === 'function') this._callback();
  }

  _clearCanvas() {
    this._isClearingCanvas = true;
    this.canvas.remove(...this.canvas.getObjects());
    this._isClearingCanvas = false;
  }

  async undo() {
    if (this.history.length <= 1) return; // Prevent undoing beyond the initial state

    this._clearCanvas();

    const curr = this.history.pop();
    if (!curr) return;

    this.historyRedo.push(curr); // Remove the current state

    const lastState = this.history[this.history.length - 1]!;
    const objects: fabric.FabricObject[] = await fabric.util.enlivenObjects(
      lastState
    );

    this._applyState(objects);
  }

  canPerformUndo() {
    return this.history.length > 1;
  }

  async redo() {
    if (this.historyRedo.length === 0) return; // Prevent undoing beyond the initial state

    this._clearCanvas();
    const lastState = this.historyRedo.pop()!;
    this.history.push(lastState);

    const objects: fabric.FabricObject[] = await fabric.util.enlivenObjects(
      lastState
    );

    this._applyState(objects);

    console.log({ redo: this.historyRedo, his: this.history });
  }

  canPerformRedo() {
    return this.historyRedo.length > 0;
  }

  _enableEvents() {
    // this.canvas.on("custom:added", () => this._saveCanvasState());
    this.canvas.on('object:added', () => this._saveCanvasState());
    this.canvas.on('object:modified', () => this._saveCanvasState());
    this.canvas.on('object:removed', () => {
      if (!this._isClearingCanvas) {
        this._saveCanvasState();
      }
    });
  }

  _applyState(objects: fabric.FabricObject[]) {
    // this.canvas.off("custom:added");
    this.canvas.off('object:added');
    this.canvas.off('object:modified');
    this.canvas.off('object:removed');

    objects.forEach(obj => {
      this.canvas.add(obj);
    });

    // Re-enable event listeners
    this._enableEvents();

    if (typeof this._callback === 'function') this._callback();
    this.canvas.renderAll();
  }
}

export default CanvasHistory;
