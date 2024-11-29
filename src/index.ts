import * as fabric from 'fabric';

/**
 * Class representing the history of a Fabric.js canvas, allowing undo and redo operations.
 */
class FabricCanvasHistory {
  private canvas: fabric.Canvas;
  private history: fabric.FabricObject[][];
  private historyRedo: fabric.FabricObject[][];
  private _isClearingCanvas: boolean;
  private _callback?: () => void;

  /**
   * Creates an instance of FabricCanvasHistory.
   * @param canvas - The Fabric.js canvas instance to track.
   * @param changeCallback - Optional callback function to be called on history change.
   */
  constructor(canvas: fabric.Canvas, changeCallback?: () => void) {
    this.canvas = canvas;
    this.history = [];
    this.historyRedo = [];
    this._isClearingCanvas = false; // Flag to avoid tracking during canvas clearing
    this._callback = changeCallback;
  }

  /**
   * Initializes the history tracking by enabling events and saving
   * the initial state.
   */
  init() {
    this._enableEvents(); // track changes
    this._saveCanvasState(); // Save initial state
  }

  /**
   * Saves the current state of the canvas to the history.
   * @private
   */
  private _saveCanvasState() {
    const jsonCanvas: fabric.FabricObject[] = structuredClone(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.canvas.toObject(['name', 'padding']).objects
    ) as fabric.FabricObject[];
    this.history.push(jsonCanvas);

    // set redo history to empty
    this.historyRedo = [];

    if (typeof this._callback === 'function') this._callback();
  }

  /**
   * Clears the canvas without tracking the clearing operation in history.
   * @private
   */
  private _clearCanvas() {
    this._isClearingCanvas = true;
    this.canvas.remove(...this.canvas.getObjects());
    this._isClearingCanvas = false;
  }

  /**
   * Undoes the last operation, reverting the canvas to the previous state.
   * If there is no previous state, the method does nothing.
   */
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

  /**
   * Checks if an undo operation can be performed.
   * @returns True if undo can be performed, otherwise false.
   */
  canPerformUndo() {
    return this.history.length > 1;
  }

  /**
   * Redoes the last undone operation, restoring the canvas to the state before the last undo.
   * If there is no state to redo, the method does nothing.
   */
  async redo() {
    if (this.historyRedo.length === 0) return; // Prevent undoing beyond the initial state

    this._clearCanvas();
    const lastState = this.historyRedo.pop()!;
    this.history.push(lastState);

    const objects: fabric.FabricObject[] = await fabric.util.enlivenObjects(
      lastState
    );

    this._applyState(objects);
  }

  /**
   * Checks if a redo operation can be performed.
   * @returns True if redo can be performed, otherwise false.
   */
  canPerformRedo() {
    return this.historyRedo.length > 0;
  }

  /**
   * Clears the undo and redo stacks.
   */
  clear() {
    this.history = [];
    this.historyRedo = [];
    if (typeof this._callback === 'function') this._callback();
  }

  /**
   * Sets the callback function to be called on history change.
   * @param callback - The callback function.
   */
  setCallback(callback: () => void) {
    this._callback = callback;
  }

  /**
   * Enables event listeners to track changes on the canvas.
   * @private
   */
  private _enableEvents() {
    // this.canvas.on("custom:added", () => this._saveCanvasState());
    this.canvas.on('object:added', () => this._saveCanvasState());
    this.canvas.on('object:modified', () => this._saveCanvasState());
    this.canvas.on('object:removed', () => {
      if (!this._isClearingCanvas) {
        this._saveCanvasState();
      }
    });
  }

  /**
   * Applies a given state to the canvas.
   * @param objects - The array of Fabric.js objects representing the state to apply.
   * @private
   */
  private _applyState(objects: fabric.FabricObject[]) {
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

export { FabricCanvasHistory };
