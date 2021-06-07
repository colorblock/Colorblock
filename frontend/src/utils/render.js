import GIFEncoder from 'gif-encoder-2';
import gifFrames from 'gif-frames';

import { defaultColor } from '../store/reducers/creator';

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

export const convertRgbaToHex = (rgbaStr) => {
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

export const createFramesFromImage = async (imageBlob) => {

  console.log('12312');
  const imageUrl = URL.createObjectURL(imageBlob);
  const imageType = imageBlob.type;
  
  const canvasList = [];
  const delaysRaw = [];
  if (imageType.includes('gif')) {
    // generate canvas list from gif
    const config = { 
      url: imageUrl, 
      frames: 'all',
      outputType: 'canvas',
      cumulative: true
    };
    await gifFrames(config).then((frameData) => {
      frameData.forEach(frame => {
        canvasList.push(frame.getImage());
        delaysRaw.push(frame.frameInfo.delay);
      });
    });
  } else {
    // handle static image
    const canvas = await new Promise(resolve => {
      // load image into canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = defaultColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      }
      img.src = URL.createObjectURL(imageBlob);
    });
    canvasList.push(canvas);
    delaysRaw.push(100);
  }


  console.log(delaysRaw);
  const width = canvasList[0].width;
  const height = canvasList[0].height;
  const delays = delaysRaw.map(delay => delay / 100);
  const duration = delays.reduce((a, b) => a + b, 0);
  const intervals = [];
  delays.forEach((_, index) => {
    const accuDelay = delays.slice(0, index + 1).reduce((a, b) => a + b, 0);
    const interval = Math.floor(accuDelay * 100 / duration);
    intervals.push(interval);
  });
  const frameIds = delaysRaw.map((_, index) => index);

  const frames = {
    width,
    height,
    activeId: 0,
    duration,
    frameIds,
    frameList: {}
  };

  canvasList.forEach((canvas, index) => {
    // read image data from canvas
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const cells = [];
    for (var i = 0; i < pixels.length; i += 4) {
      const color = pixels.slice(i, i + 3);
      const rgba = `rgba(${color.join()},1)`;
      cells.push(rgba);
    }

    const interval = intervals[index];
    const frame = {
      id: 0,
      interval,
      cells
    };
    frames.frameList[index] = frame;
  });

  return frames;
};
