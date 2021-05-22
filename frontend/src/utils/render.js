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
    if (singleFrameId == null || singleFrameId === frameId) {
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

const convertRgbaToHex = (rgbaStr) => {
  // rgba(255, 255, 255, 1) to #FFFFFF
  const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const [r, g, b] = rgbaStr.slice(5, -1).split(',').map(v => parseInt(v));
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

export const convertFramesToString = (frames, singleFrameId=null) => {
  let result = '';
  frames.frameIds.forEach((frameId) => {
    const frame = frames.frameList[frameId];
    if (singleFrameId == null || singleFrameId === frameId) {
      const cells = frame.cells;
      const hexList = cells.map(rgbaStr => convertRgbaToHex(rgbaStr).slice(1));
      const hexStr = hexList.join('');
      result = result.concat(hexStr);
    }
  });
  return result;
};

export const convertFramesToIntervals = (frames, singleFrameId=null) => {
  if (singleFrameId == null) {
    const intervalList = [];
    frames.frameIds.forEach((frameId, index) => {
      const frame = frames.frameList[frameId];
      intervalList.push(frame.interval);
    });
    const intervals = [];
    intervalList.forEach((interval, index) => {
      const lastInterval = index === 0 ? 0 : intervalList[index - 1];
      const intervalDiff = interval - lastInterval;
      const duration = frames.duration * intervalDiff / 100;
      intervals.push(duration);
    });
    return intervals;
  } else {
    return [1.0];
  }
};