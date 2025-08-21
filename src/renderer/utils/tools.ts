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
    getItem: async (key: string) => {
        const value = await localStorage.getItem(key);
        if (value) {
            try {
                return JSON.parse(value);
            } catch (error) {
                return value;
            }
        }
        return null;
    },
    setItem: async (key: string, value: string | object) => {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        return await localStorage.setItem(key, value as string);
    },
    removeItem: async (key: string) => {
        return await localStorage.removeItem(key);
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