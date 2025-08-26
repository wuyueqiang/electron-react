/**
 * @author Alizeegod
 * @Date 2020-10-27 15:51:58
 * @Description 检测文件类型
 *
 * */

import { FILE_EXT } from '../vars/room-vars'

const CheckFileExt = (name: string) => {
    if (/\.(jpg|jpeg|png)/i.test(name)) {
        return FILE_EXT.IMAGE;
    } else if (/\.(mp4)/i.test(name)) {
        return FILE_EXT.VIDEO;
    } else if (/\.(mp3)/i.test(name)) {
        return FILE_EXT.AUDIO;
    } else if (/\.(ppt|pptx)/i.test(name)) {
        return FILE_EXT.PPT;
    } else if (/\.(pdf)/i.test(name)) {
        return FILE_EXT.PDF;
    } else {
        return FILE_EXT.UnKnowFile;
    }
}

export default CheckFileExt;

