
export const INIT_YSLIVECLIENT = 'INIT_YSLIVECLIENT';

export function initYsLiveClient(client: any) {
    return {
        type: INIT_YSLIVECLIENT,
        client
    }
}

