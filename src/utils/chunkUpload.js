import {uploadChunk, mergeChunk} from "@/api/index.js";
//创建切片
export const creatChunks = (file) => {
    console.log('文件', file)
    const chunkSize = 2 * 1024 * 1024; //一个切片2M
    const chunkCount = Math.ceil(file.size / chunkSize); //切片数量
    console.log('切片数量', chunkCount)
    const chunks = []; //切片
    for (let i = 0; i < chunkCount; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        chunks.push(file.slice(start, end));
    }
    return chunks;
}

//上传切片
export const uploadChunks = async (chunks, filename) => {
    console.log('filename',filename)
    const fetchList = chunks.map((chunk,index) => _uploadChunk(chunk,filename,index))
    await Promise.all(fetchList)

    //上传成功后通知合并
    await mergeChunks(filename)
}


//上传单个切片
const _uploadChunk = async (chunk, filename,hash) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('filename', filename);
    formData.append('hash', hash);
    try {
        await uploadChunk(formData)
    } catch (err) {
        console.log(err);
    }
}


const mergeChunks = async (filename) => {
    console.log('filename',filename)
    await mergeChunk({filename})
}