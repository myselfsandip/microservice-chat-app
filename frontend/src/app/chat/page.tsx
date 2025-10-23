"use client"

import ChatHeader from '@/components/ChatHeader';
import ChatSidebar from '@/components/ChatSidebar';
import Loading from '@/components/Loading';
import { useAppData, User } from '@/context/AppContext'
import { chatApi } from '@/services/chatApi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';

export interface Message {
    _id: string;
    chatId: string;
    sender: string;
    text?: string;
    image?: {
        url: string;
        publicId: string;
    }
    messageType: "text" | "image";
    seen: boolean;
    seenAt?: string;
    createdAt: string;

}

const ChatApp = () => {
    const { isAuth, loading, logoutUser, chats, user: loggedInUser, users, fetchChats, setChats } = useAppData();
    const router = useRouter();

    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [message, setmessage] = useState("");
    const [sidebarOpen, setsidebarOpen] = useState<boolean>(false);
    const [messages, setmessages] = useState<Message[] | null>(null);
    const [user, setuser] = useState<User | null>(null);
    const [showAllUsers, setshowAllUsers] = useState<boolean>(false);
    const [isTyping, setisTyping] = useState<boolean>(false);
    const [typingTimeOut, settypingTimeOut] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuth && !loading) {
            router.push("/login");
        }
    }, [isAuth, loading, router]);

    async function fetchChat() {
        try {
            const data = await chatApi.fetchMessages(selectedUser);
            setmessages(data.messages);
            setuser(data.user);
            await fetchChats();
        } catch (error) {
            console.log(error);
            toast.error("Failed to load messages");
        }
    }

    async function createChat(u: User) {
        try {
            const data = await chatApi.new(loggedInUser?._id, u._id);
            setSelectedUser(data.chatId);
            setshowAllUsers(false);
            await fetchChats();
        } catch (error) {
            toast.error("Failed to start chat");
        }
    }

    useEffect(() => {
        if (selectedUser) {
            fetchChat();
        }
    }, [selectedUser]);


    if (loading) return <Loading />;

    return (
        <div className='min-h-screen flex bg-gray-900 text-white relative overflow-hidden'>
            <ChatSidebar
                sidebarOpen={sidebarOpen} setSidebarOpen={setsidebarOpen}
                showAllUsers={showAllUsers} setShowAllUsers={setshowAllUsers}
                users={users}
                loggedInUser={loggedInUser}
                chats={chats}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                handleLogout={logoutUser}
                createChat={createChat}
            />

            {/* Chat Header */}
            <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 ">
                <ChatHeader />
            </div>
        </div>
    )
}

export default ChatApp;