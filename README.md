# Fabric History

This package provides a single class called `FabricCanvasHistory` which
provides the necessary functionality to undo and redo changes in a Fabric.js
canvas.

See https://fabric-history.syrusdark.cc/ for a live demo using Next.js
and source code at https://github.com/naveen521kk/fabric-history-example.

## Installation

```bash
npm install --save @naveen521kk/fabric-history
```

## Usage

```javascript
import { FabricCanvasHistory } from '@naveen521kk/fabric-history';

const canvas = new fabric.Canvas('canvas');
const history = new FabricCanvasHistory(canvas); // Optionally pass a callback function to get notified when history changes

history.init(); // Initialize the history

// Add a new object to the canvas
canvas.add(new fabric.Rect({ width: 100, height: 100, fill: 'red' }));

// Undo the last change
history.undo();

// Redo the last undone change
history.redo();
```
