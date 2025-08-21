import { xlog } from '../api';
import { LStorage } from './tools';
import os from 'os';
import { version } from '../../../package.json'

export default async function errorLog(content: object, level: string = 'INFO') {
    try {
        let postData = content != null ? content : {};
        // 判断是否 ajaxUrl 上报日志
        if (postData.ajaxUrl) {
            postData.ajax_url_path = postData.ajaxUrl.split("?")[0]
        }
        //请求url
        postData.request_url = window.location.href ? window.location.href : '';
        // 请求url路径
        if (window.location.href.split('?').length > 2) {
            postData.request_url_path = window.location.href.split('?')[0] + window.location.href.split('?')[1];
        } else {
            postData.request_url_path = window.location.href.split('?')[0];
        }
        //AJAX_CODE 请求从response_data.msg中获取。非 AJAX_CODE 请求参数携带
        if (!postData.message) {
            postData.message = postData.response_data.msg
        }
        postData.version = version
        
        // logger.info(JSON.stringify(postData));
        window.electron.ipcRenderer.sendMessage('setLogger', postData);

        let timestamp = new Date().getTime();
        let messages = [
            {
                level: level,
                timestamp: timestamp,
                data: postData
            }
        ];

        
        // let user_id = store.get('USER_INFO')?.userId;
        let user_id = (await LStorage.getItem('USER_INFO'))?.userId;
        let soft = 'teacher_live_app';
        let osType = os.type();
        //存储log日志
        xlog(
            "liveSystem",
            user_id,
            soft,
            osType,
            JSON.stringify(messages)
        ).then(res => {
            // console.log(res);
        });
    } catch (e) {
        console.warn(e)
    }

}
