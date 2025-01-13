import axios from "axios";

const request = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 10000,
})

request.interceptors.request.use(config => {
    console.log('request', config)
    return config;
})

request.interceptors.response.use(response => {
    console.log('response', response)
    return response.data;
})

export default request;
