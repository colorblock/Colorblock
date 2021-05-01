import * as actions from '../src/store/actions/actionCreator';
import * as types from '../src/store/actions/actionTypes';

describe('creator actions', () => {
  it('should create an action to create new project', () => {
    const expectedAction = {
      type: types.NEW_PROJECT
    };
    expect(actions.newProject()).toEqual(expectedAction);
  });
});
