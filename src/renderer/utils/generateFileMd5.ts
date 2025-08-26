/**
 * @author Alizeegod
 * @Date 2020-10-21 18:37:53
 * @Description 对上传文件进行MD5加密
 *
 * */

// import SparkMD5 from 'spark-md5';
const SparkMD5 = require('spark-md5');

const GenerateFileMd5 = async (file: any) => {
    // @ts-ignore
    let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
        chunkSize = 2 * 1024 * 1024,                             // Read in chunks of 2MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer(),
        fileReader = new FileReader();

    function loadNext() {
        let start = currentChunk * chunkSize,
            end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    loadNext();

    return new Promise((resolve, reject) => {
        fileReader.onload = function (e: any) {
            // console.log('read chunk nr', currentChunk + 1, 'of', chunks);
            spark.append(e.target.result);                   // Append array buffer
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            } else {
                let hash = spark.end();
                // console.log('finished loading');
                console.info('computed hash', hash);  // Compute hash
                resolve(hash);
            }
        };

        fileReader.onerror = function (error) {
            console.warn('oops, something went wrong.');
            reject(error)
        };
    })
}

export default GenerateFileMd5
