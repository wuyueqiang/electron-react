/**
 * @author Alizeegod
 * @Date 2021-01-11 18:25:56
 * @Description
 *
 * */
import webEnv from '../utils/webEnv';

export default function() {
    try {
        let whiteboardUrl = '';
        if (webEnv() == 'prod') {
            whiteboardUrl = 'https://media.youshu.cc/static/files/YSWhiteboard.js';
        } else {
            whiteboardUrl = 'https://media.youshu.cc/static/files/test/YSWhiteboard.js';
        }
        // 添加白板
        const scriptDom = document.createElement('script');
        const time = new Date().getTime();
        scriptDom.src = whiteboardUrl + '?time=' + time;
        document.getElementsByTagName('head')[0].appendChild(scriptDom);
    } catch (e) {
       console.warn(e);
    }
}
