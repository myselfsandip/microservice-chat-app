import axios from 'axios';


export const API_BASE_URL = process.env.NEXT_PUBLIC_USER_SERVICE;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});



export default apiClient;