import * as actionCreators from '../store/actions/actionCreators';
import { initStorage, getDataFromStorage } from './storage';

/*
  Initial actions to dispatch:
  1. Hide spinner
  2. Load a project if there is a current one
*/
const initialSetup = (dispatch, storage) => {
  dispatch(actionCreators.hideSpinner());

  let dataStored = getDataFromStorage(storage);
  if (!dataStored.stored) {
    // If no data initialize storage
    initStorage(storage);
  }

  dataStored = getDataFromStorage(storage);
  if (dataStored.stored) {
    // Load current project from the storage
    const currentProjectIndex = dataStored.current;
    if (currentProjectIndex >= 0) {
      const {
        frames,
        paletteGridData,
        columns,
        rows,
        cellSize
      } = dataStored.stored[currentProjectIndex];

      dispatch(
        actionCreators.setDrawing(
          frames,
          paletteGridData,
          cellSize,
          columns,
          rows
        )
      );
    }
  }
};

export default initialSetup;
