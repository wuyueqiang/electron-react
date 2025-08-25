export const getCommendParam = (name: string) => {
    let args = process.argv;
    let params = args.slice(1);
    let value: any = null;
    (params || []).forEach((item: any) => {
        let i = item.split('=');
        if (i[0] == name) {
            value = i[1];
        }
    })

    return value;
}

export const getUUID = () => {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    return uuid;
}
// async
export const LStorage = {
    getItem: (key: string) => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                return JSON.parse(value);
            } catch (error) {
                return value;
            }
        }
        return null;
    },
    setItem: (key: string, value: string | object) => {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value as string);
        return true;
    },
    removeItem: (key: string) => {
        localStorage.removeItem(key);
        return true;
    }
}

export function timestampToDate (timestamp:number)  {
    if (timestamp && timestamp > 0) {
        const date = new Date(timestamp) // 时间戳为10位需*1000，时间戳为13位的话不需乘1000
        const Y = date.getFullYear()
        const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1)
        const D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
        const h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        const m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        // const s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
        return Y + '/' + M + '/' + D + ' ' + h + ':' + m
    }
    else {
        return '-'
    }
}

export function timestampToTime(timestamp: number) {
    if (timestamp && timestamp > 0) {
        const date = new Date(timestamp) // 时间戳为10位需*1000，时间戳为13位的话不需乘1000
        const h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        const m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        // const s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
        return h + ':' + m
    }
    else {
        return '-'
    }
}

export const Tool = {
    awaitWrap(promise) {
        return promise.then(data => [null, data]).catch(error => [error, null]);
    },

    //获取url参数上的集合
    getUrlParam(urlStr:string) {
        let url = ''
        if (typeof urlStr == "undefined") {
            url = decodeURI(location.search); //获取url中"?"符后的字符串
        } else {
            url = "?" + urlStr.split("?")[1];
        }
        const theRequest:any = new Object();
        if (url.indexOf("?") != -1) {
            const str = url.substr(1);
            const strs = str.split("&");
            for (var i = 0; i < strs.length; i++) {
                theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
            }
        }
        return theRequest;
    },

    /*
    * 获取url传递数值
    * */
    getId(url: string, name: string) {
        let text = "";
        if(url.split("?")[1]){
            let uri = url.split("?")[1].split("&");
            for(let i=0;i<uri.length;i++){
                let id= url.split("?")[1].split("&")[i].indexOf("=");
                let nick = url.split("?")[1].split("&")[i].substring(0,id);
                if(name== nick){
                    text = url.split("?")[1].split("&")[i].substring(id+1)
                }
            }
        }
        return text;
    },

    // 判断时间戳是否是今天
    isToday(timestamp: number) {
        if (timestamp > 0) {
            let dateA = new Date(timestamp);
            let dateB = new Date();
            return (dateA.setHours(0, 0, 0, 0) == dateB.setHours(0, 0, 0, 0));
        }else {
            return false
        }
    },

    // 13位时间戳转 YYYY-MM-DD HH:MM:SS
    timestampToStr(timestamp: number) {
        if (timestamp > 0) {
            const date = new Date(timestamp)
            const Y = date.getFullYear()
            const Mon = date.getMonth() + 1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1 
            const D = date.getDate() < 10 ? '0'+date.getDate() : date.getDate()
            const H = date.getHours() < 10 ? '0'+date.getHours() : date.getHours()
            const Min = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()
            const S = date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds()
            return `${Y}-${Mon}-${D} ${H}:${Min}:${S}`
        }else {
            return ''
        }
    },

    // 在TRTC uid中获取有书用户id, 如果是白板用户返回WhiteBoard
    trtcUidToUid(str: String) {
        if (str == '') {
            return ''
        }
        if (str.indexOf('1b36e1bf5785013') > -1) {
            return 'WhiteBoard'
        }else {
            let arr = str.split('_')
            return arr[2] || ''
        }
    }
}
