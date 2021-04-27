import formatPixelColorOutput from './color';
import shortid from 'shortid';
import { List, Map } from 'immutable';

/*
 *  arrayChunks
 *  @param {array} An array
 *  @param {number} The number of elements we want in our chunk
 *  @return {array} An array of arrays chunks
 */
const arrayChunks = (array, chunkSize) =>
  Array(Math.ceil(array.length / chunkSize))
    .fill()
    .map((_, index) => index * chunkSize)
    .map(begin => array.slice(begin, begin + chunkSize));

/*
 *  formatFrameOutput
 *  @param {array} The frame, an array of color values
 *  @param {number} The columns count
 *  @param {object} It contains different options to format the output
 *  @return {string} The formatted output of the passed frame
 */
const formatFrameOutput = (frame, columns, options) => {
  const isEven = number => number % 2 === 0;
  const flattened = arr => [].concat(...arr);
  let frameRows = arrayChunks(frame, columns);
  frameRows = frameRows.map((row, index) => {
    if (
      (isEven(index + 1) && options.reverseEven) ||
      (!isEven(index + 1) && options.reverseOdd)
    ) {
      return row.reverse();
    }
    return row;
  });
  const frameFormatted = flattened(frameRows);

  const lastPixelPos = frameFormatted.length;
  return frameFormatted.reduce((acc, pixel, index) => {
    const pixelFormatted = formatPixelColorOutput(pixel, options.colorFormat);
    return `${acc} ${pixelFormatted}${index + 1 === lastPixelPos ? '' : ','}${
      (index + 1) % columns ? '' : '\n'
    }`;
  }, '');
};

/*
 *  generateFramesOutput
 *  @param {object} It contains all frames data, the columns count and different options to format the output
 *  @return {string} The formatted output of all the frames
 */
const generateFramesOutput = ({ frames, columns, options }) =>
  frames
    .toJS()
    .reduce(
      (acc, frame, index) =>
        `${acc}${index ? '\n' : ''}frame${index} = {\n${formatFrameOutput(
          frame.grid,
          columns,
          options
        )}};`,
      ''
    );

export const arrayToMatrix = (frameList, columns, rows) => {
  // convert array list to matrix list
  return frameList.map(frame => {
    let grid = frame.grid.map(str => str.slice(1));
    // suppose grid length = columns * rows here
    const matrix = [];
    for (var i=0; i<rows; i++) {
      const row = grid.slice(0, columns);
      matrix.push(row);
      grid = grid.slice(columns);
    }
    return matrix;
  });
};

export const matrixToArray = (frames, intervals) => {
  // convert matrix list to array list
  const duration = intervals.reduce((a, b) => a + b, 0);
  const columns = frames[0][0].length;
  const rows = frames[0].length;
  const frameList = frames.map((matrix, index) => {
    const grid = matrix.map(row => row.map(str => `#${str}`)).flat();
    const addUpInterval = intervals.slice(0, index + 1).reduce((a, b) => a + b, 0);
    const interval = Math.floor(100 * addUpInterval / duration);
    const key = shortid.generate();
    const frame = Map({
      grid,
      interval,
      key
    });
    return frame;
  });
  return Map({
    list: List(frameList),
    columns,
    rows,
    duration
  });
};

export default generateFramesOutput;
