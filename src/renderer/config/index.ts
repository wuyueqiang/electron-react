/**
 * @author Alizeegod
 * @Date 2020-07-31 10:58:25
 * @Description
 *
 * */

import pkg from '../../../package.json';
import WebEnv from '../utils/webEnv'

let npm_env: string;
let APP_NAME: string;
let LIVE_URL: string;
let READWITH_URL: string;
let XLOG_HOST: string;
let YOUSHU_URL: string;
let SENTRY_DSN: string = 'https://f7a8f30c757a47e082e42f8a1f2ff2ed@sentry2.youshu.cc/7'; // sentry DSN
let SENTRY_MINIDUMP_URL: string = 'https://sentry2.youshu.cc/api/7/minidump/?sentry_key=f7a8f30c757a47e082e42f8a1f2ff2ed'; // sentry捕获崩溃URL
let PKG_NAME: string = pkg.name;
let COMPONY_NAME: string = 'youshu';
let RESOURCE_PATH: string; // 静态资源目录
let LUBAN_KEY = '';
let PRODUCT_NAME: string = pkg.build.productName;
let SENSORS_SERVER_URL: string;
let VERSION: string = pkg.version;
let UPDATE_URL: string;

if (WebEnv() == 'local') {
    npm_env = 'rd';
    APP_NAME = 'rd_live_teacher';
    LIVE_URL = 'http://live.laidan.com';
    READWITH_URL = 'http://gondu.laidan.com';
    XLOG_HOST = 'https://xlog.laidan.com'
    YOUSHU_URL = 'http://gongdu.laidan.com'
    SENSORS_SERVER_URL = 'https://sd.youshu.cc:8106/sa?project=default'
    UPDATE_URL = 'https://media.youshu.cc/liveInstall_rd/'

    // npm_env = 'qa';
    // APP_NAME = 'qa_live_teacher';
    // LIVE_URL = 'https://qa-live.laidan.com';
    // READWITH_URL = 'https://qa-gongdu.laidan.com';
    // XLOG_HOST = 'https://qa-xlog.laidan.com'
    // YOUSHU_URL = 'https://qa-gongdu.laidan.com'
    // SENSORS_SERVER_URL = 'https://sd.youshu.cc:8106/sa?project=default'
    // UPDATE_URL = 'https://media.youshu.cc/liveInstall_qa/'

    LUBAN_KEY = ''
} else if (WebEnv() == 'test') {
    npm_env = 'rd';
    APP_NAME = 'rd_live_teacher';
    LIVE_URL = 'http://live.laidan.com';
    READWITH_URL = 'http://gondu.laidan.com';
    XLOG_HOST = 'https://xlog.laidan.com'
    YOUSHU_URL = 'https://gongdu.laidan.com'
    SENSORS_SERVER_URL = 'https://sd.youshu.cc:8106/sa?project=default'
    UPDATE_URL = 'https://media.youshu.cc/liveInstall_rd/'

    LUBAN_KEY = ''
} else if (WebEnv() == 'qa') {
    npm_env = 'qa';
    APP_NAME = 'qa_live_teacher';
    LIVE_URL = 'https://qa-live.laidan.com';
    READWITH_URL = 'https://qa-gongdu.laidan.com';
    XLOG_HOST = 'https://qa-xlog.laidan.com'
    YOUSHU_URL = 'https://qa-gongdu.laidan.com'
    SENSORS_SERVER_URL = 'https://sd.youshu.cc:8106/sa?project=default'
    UPDATE_URL = 'https://media.youshu.cc/liveInstall_qa/'

    LUBAN_KEY = ''
} else {
    npm_env = 'prod';
    APP_NAME = 'live_teacher';
    LIVE_URL = 'http://live1.youshu.cc';
    READWITH_URL = 'http://gondu.youshu.cc';
    XLOG_HOST = 'https://xlog.youshu.cc';
    YOUSHU_URL = 'http://gongdu.youshu.cc'
    SENSORS_SERVER_URL = 'https://sd.youshu.cc:8106/sa?project=production'
    UPDATE_URL = 'https://media.youshu.cc/liveInstall/'

    LUBAN_KEY = ''
}




if (process.env.NODE_ENV === 'development') {
    RESOURCE_PATH = __dirname + '/../../assets';
} else {
    RESOURCE_PATH = process.resourcesPath;
}

export {
    npm_env,
    APP_NAME,
    VERSION,
    LIVE_URL,
    READWITH_URL,
    SENTRY_DSN,
    SENTRY_MINIDUMP_URL,
    UPDATE_URL,
    COMPONY_NAME,
    RESOURCE_PATH,
    XLOG_HOST,
    YOUSHU_URL,
    LUBAN_KEY,
    PKG_NAME,
    PRODUCT_NAME,
    SENSORS_SERVER_URL
}
