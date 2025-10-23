import { User } from "@/context/AppContext";
import { chatServiceApiClient } from "./apiClient";


export const chatApi = {
    all: async () => {
        const response = await chatServiceApiClient.get('/api/v1/chat/all');
        return response.data;
    },
    new: async (userId: string | undefined, otherUserId: string | null) => {
        const response = await chatServiceApiClient.post('/api/v1/chat/new', { userId, otherUserId });
        return response.data;
    },
    fetchMessages: async(user: string | null) => {
        const response = await chatServiceApiClient.get(`/api/v1/chat/message/${user}`);
        return {
            messages: response.data.messages,
            user: response.data.user
        };
    }

}