import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import ysLiveClient from './ysLiveClient';
// import roomConfig from './roomConfig';

export default function createRootReducer() {
    return combineReducers({
        ysLiveClient,
        // roomConfig
    });
}
