/**
 * @Descriptions:
 * @author Alizeegod
 * @date
 */

import axios from 'axios';
import { YOUSHU_URL, LUBAN_KEY } from '../config';
import { youshuCheckSign } from './youshuCheckSign';
import pkg from '../../../package.json';
import Qs from 'qs';
import { LStorage } from './tools';
// import Store from 'electron-store';

// const store: any = new Store();

interface AxiosParams {
    type: string,
    baseUrl: string,
    path: string,
    data?: object,
    dataType?: string,
    contentType?: string,
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
    let { type, baseUrl, path, data, dataType = '', contentType = 'application/x-www-form-urlencoded' } = params
    type = type.toUpperCase();
    if (baseUrl == '') {
        baseUrl = YOUSHU_URL
    }
    let requesurl = `${baseUrl}${path}`;
    let uriObj = Object.assign({}, data);

    const userInfo = LStorage.getItem('USER_INFO') || {};
    // @ts-ignore
    let url = youshuCheckSign(uriObj, requesurl, type, contentType)
    let responseJson = await service({
        method: type,
        // url: requesurl,
        url: url,
        data: dataType == 'json' ? JSON.stringify(data) : Qs.stringify(data),
        headers: {
            'Content-Type': contentType,
            'Grpc-Metadata-live_token': userInfo.liveToken || '',
            'Grpc-Metadata-app': userInfo.app || '',
            'Grpc-Metadata-user_id': userInfo.userId || '',
            'luban-key': LUBAN_KEY
        },
        withCredentials: true
    });

    return responseJson.data;
}
