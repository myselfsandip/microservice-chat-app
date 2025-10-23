import { userServiceApiClient } from "./apiClient";


export const userApi = {
    login: async (email: string) => {
        const response = await userServiceApiClient.post('/api/v1/user/login', { email });
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
    }
}