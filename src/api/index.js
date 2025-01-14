import request from "./request.js";

//文件上传
export const upload = (data, config = {}) => {
    return request({
        url: '/upload',
        method: 'POST',
        data: data,
        ...config
    })
}

//切片上传
export const uploadChunk = (data, config = {}) => {
    return request({
        url: '/chunk',
        method: 'POST',
        data: data,
        ...config
    })
}

//合并上传
export const mergeChunk = (data, config = {}) => {
    return request({
        url: '/merge',
        method: 'POST',
        data: data,
        ...config
    })
}