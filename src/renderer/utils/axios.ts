/**
 * @Descriptions:
 * @author Alizeegod
 * @date
 */

import axios from 'axios';
import { LIVE_URL, LUBAN_KEY } from '../config';
import pkg from '../../../package.json';
import Qs from 'qs';
import { LStorage } from './tools';
// import Store from 'electron-store';
// const store = new Store();
import errorLog from './errorLog';
import { youshuCheckSign } from './youshuCheckSign';
interface AxiosParams {
    type: string,
    baseUrl: string,
    path: string,
    data?: object,
    dataType?: string,
    contentType?: string,
    shutLog?: boolean,
}

const service = axios.create({
    timeout: 10000,
});

service.interceptors.request.use(function (config) {
    config.headers['Grpc-Metadata-device_id'] = LStorage.getItem('DEVICE_ID')||'';
    config.headers['Grpc-Metadata-ua'] = navigator.userAgent;
    config.headers['Grpc-Metadata-version'] = pkg.version;
    return config;
}, function (error) {
    return Promise.reject(error);
});

export default async (params: AxiosParams) => {
    let {shutLog = false, type, baseUrl, path, data, dataType = '', contentType = 'application/x-www-form-urlencoded' } = params
    type = type.toUpperCase();
    if (baseUrl == '') {
        baseUrl = LIVE_URL
    }
    let requesurl = `${baseUrl}${path}`;
    let uriObj = Object.assign({}, data);
    
    const userInfo = await LStorage.getItem('USER_INFO') || {};
    // @ts-ignore
    let url = await youshuCheckSign(uriObj, requesurl, type, contentType)
    let responseJson = await service({
        method: type,
        // url: requesurl,
        url: url,
        data: dataType == 'json' ? JSON.stringify(data) : Qs.stringify(data),
        headers: {
            'Content-Type': contentType,
            'Grpc-Metadata-live_token': (userInfo as any)?.liveToken || '',
            'Grpc-Metadata-app': (userInfo as any)?.app || '',
            'Grpc-Metadata-user_id': (userInfo as any)?.userId || '',
            'luban-key': LUBAN_KEY
        },
        withCredentials: true
    });
    try {
        let excludeLogCode = [1, 200]

        // xlog code过滤 排查code 和 xlog接口错误记录
        var is_suc = excludeLogCode.findIndex(function (item) {
            return item == responseJson?.data?.status?.code
        })
        // 过滤code值已6开头长度为7位的code值，不记xlog
        if (responseJson?.data?.status?.code?.toString().length == 7 && responseJson?.data?.status?.code?.toString().substring(0,1) == '6' && !shutLog) {
            shutLog = true;
        }
        if (is_suc == -1 && !shutLog) {
            var logContent = {
                code:"AJAX_CODE",
                log_type: "AJAX_CODE",
                ajaxUrl: requesurl,
                request_data: uriObj,
                request_cookie: document.cookie,
                response_data: {
                    code: responseJson.data.status.code,
                    msg: responseJson.data.status.msg
                },
            }
            errorLog(logContent, "ERR")
        }
    } catch (error) {
        console.error('上报xlog catch error', error);
    }
    

    return responseJson.data;
}
