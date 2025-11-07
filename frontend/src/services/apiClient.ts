import axios from 'axios';
import Cookies from "js-cookie";

const token = Cookies.get('token');

export const userServiceApiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_USER_SERVICE}`,
    headers: {
        Authorization: `Bearer ${token}`
    }
});

export const chatServiceApiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_CHAT_SERVICE}`,
    headers: {
        Authorization: `Bearer ${token}`
    }
});



