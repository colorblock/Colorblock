import GIFEncoder from 'gif-encoder-2';

const fillCanvasWithFrame = (ctx, frameInfo) => {
  const { cells, cols, cellSize } = frameInfo;
  cells.forEach((fillStyle, pixelIdx) => {
    ctx.fillStyle = fillStyle;
    const col = pixelIdx % cols;
    const row = Math.floor(pixelIdx / cols);
    ctx.fillRect(
      col * cellSize,
      row * cellSize,
      cellSize,
      cellSize
    );
  });
  return ctx;
}

export const convertFramesToBase64 = (frames, singleFrameId=null) => {
  const min_width = 100;
  const cols = frames.width;
  const ratio = frames.height / frames.width;
  const cellSize = Math.max(1, Math.ceil(min_width / cols));
  const width = cols * cellSize;
  const height = width * ratio;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gif = new GIFEncoder(width, height);
  gif.start();

  let lastInterval = 0;
  frames.frameIds.forEach((frameId) => {
    const frame = frames.frameList[frameId];
    if (singleFrameId === null || singleFrameId === frameId) {
      const cells = frame.cells;
      const paintedCtx = fillCanvasWithFrame(ctx, {
        cells,
        cols,
        cellSize,
      });
      const delay = Math.floor((frame.interval - lastInterval) * frames.duration * 10);
      lastInterval = frame.interval;
      gif.setDelay(delay);
      gif.addFrame(paintedCtx);
    }
  });

  gif.finish();

  const buffer = gif.out.getData();
  const imageType = singleFrameId ? 'png' : 'gif';
  const url = `data:image/${imageType};base64,` + buffer.toString('base64');
  return url;
};