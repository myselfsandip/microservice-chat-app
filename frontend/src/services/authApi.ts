import apiClient from "./apiClient";


export const authApi = {
    login: async (email: string) => {
        const response = await apiClient.post('/api/v1/user/login', { email });
        return response.data;
    },
    verifyOtp: async (email: string, otp: string) => {
        const response = await apiClient.post('api/v1/user/verify', { email, otp });
        return response.data;
    },
}