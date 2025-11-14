import axios from "axios";
import { userServiceApiClient } from "./apiClient";


export const userApi = {
    login: async (email: string) => {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_USER_SERVICE}/api/v1/user/login`, { email }, { withCredentials: true });
        return response.data;
    },
    verifyOtp: async (email: string, otp: string) => {
        const response = await userServiceApiClient.post('api/v1/user/verify', { email, otp });
        return response.data;
    },
    me: async () => {
        const response = await userServiceApiClient.get(`/api/v1/user/me`);
        return response.data;
    },
    fetchAll: async () => {
        const response = await userServiceApiClient.get('api/v1/user/all');
        return response.data;
    },
    editProfile: async (name: string | undefined) => {
        const response = await userServiceApiClient.post(`api/v1/user/update`, { name });
        return response.data;
    }
}