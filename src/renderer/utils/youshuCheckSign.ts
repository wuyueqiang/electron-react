import md5 from 'js-md5';
import { LStorage } from './tools';
// import Store from 'electron-store'
import { APP_NAME } from '../config/index'
// const store: any = new Store();
export const youshuCheckSign = (data, url, type, ContentType) => {
    const userInfo = LStorage.getItem('USER_INFO')||{}
    //参数定义
    let buff,
        utt = Date.parse(new Date()) / 1000,
        key = userInfo.liveToken || '';
    if (type == "GET") {
        let getData = { ...data, timestamp: utt, ys_app_name: APP_NAME };
        let getDataGroup = new Array();
        for (let i in objKeySort(getData)) {
            getDataGroup.push(i + "=" + getData[i]);
        }
        buff = getDataGroup.join("&");
        let signature = md5(url + buff + key);
        return url + "?" + buff + "&signature=" + signature
    }else {
        if(ContentType == "application/json") {
            let postData = { timestamp: utt, ys_app_name: APP_NAME };
            let postDataGroup = new Array();
            for (let i in objKeySort(postData)) {
                postDataGroup.push(i + "=" + postData[i]);
            }
            let newUrl = url + postDataGroup.join("&");
            buff = JSON.stringify(data);
            let signature = md5(newUrl + buff + key);
            return url + "?" + postDataGroup.join("&") + "&signature=" + signature
        }else {
            let postData = { ...data, timestamp: utt, ys_app_name: APP_NAME };
            let getData = { timestamp: utt, ys_app_name: APP_NAME };
            let postDataGroup = new Array();
            let getDataGroup = new Array();
            for (let i in objKeySort(postData)) {
                postDataGroup.push(i + "=" + postData[i]);
            }
            for (let i in objKeySort(getData)) {
                getDataGroup.push(i + "=" + getData[i]);
            }
            let newUrl = url + postDataGroup.join("&");
            buff = "";
            let signature = md5(newUrl + buff + key);
            return url + "?" + getDataGroup.join("&") + "&signature=" + signature
        }
    }
}

// 过滤签名函数
export const checkOutParmes = (data) => {
    Object.keys(data).forEach(key => {
        if (key == 'timestamp' || key == 'signature' || key == 'ys_app_name') {
            delete data[key]
        }
    })
    return data;
}

//排序的函数
export const objKeySort = (obj) => {
    const newkey = Object.keys(obj).sort();
    //先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
    //创建一个新的对象，用于存放排好序的键值对
    const newObj = {};
    for (var i = 0; i < newkey.length; i++) {
        //排查为空字段
        if (obj[newkey[i]] !== '' && typeof(obj[newkey[i]]) != "undefined") {
            //遍历newkey数组，向新创建的对象中按照排好的顺序依次增加键值对
            newObj[newkey[i]] = obj[newkey[i]];
        }
    }
    return newObj; //返回排好序的新对象
}
