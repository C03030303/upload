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