
// import { Action } from 'redux';
import { INIT_YSLIVECLIENT } from '../actions/ysLiveClient';
interface Action {
    type: string,
    client:  any,
}
export default function ysLiveClient(state = null, action: Action) {
    switch (action.type) {
        case INIT_YSLIVECLIENT:
            // @ts-ignore
            return action.client;
        default:
            return state;
    }
}
