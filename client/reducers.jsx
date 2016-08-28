import {UPDATE_NAV_BAR_CONTENT} from './actions.jsx';

const initialState = {
  navBarContent: {}
};

export function georgeApplication(state=initialState, action) {
  switch(action.type) {
    case UPDATE_NAV_BAR_CONTENT:
      return Object.assign({}, state, {navBarContent: action.navBarContent});
    default:
      return state;
  }
}
