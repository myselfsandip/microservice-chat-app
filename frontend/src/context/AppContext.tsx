"use client"

import { userApi } from "@/services/userApi";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";
import { chatApi } from "@/services/chatApi";

export const userService = process.env.NEXT_PUBLIC_USER_SERVICE;
export const chatService = process.env.NEXT_PUBLIC_CHAT_SERVICE;

export interface User {
    _id: string;
    name: string;
    email: string;
}

export interface Chat {
    _id: string;
    users: string[];
    latestMessage: {
        text: string;
        senderId: string;
    };
    createdAt: string;
    updatedAt: string;
    unseenCount?: number;
}

export interface Chats {
    _id: string;
    user: User;
    chat: Chat;
}

interface AppContextType {
    user: User | null;
    loading: boolean;
    isAuth: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
    logoutUser: () => void;
    fetchUsers: () => Promise<void>;
    fetchChats: () => Promise<void>;
    chats: Chats[] | null;
    users: User[] | null;
    setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    async function fetchUser() {
        try {
            const data = await userApi.me();
            setUser(data);
            setIsAuth(true);
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }

    function logoutUser() {
        Cookies.remove('token');
        setUser(null);
        setIsAuth(false);
        toast.success("User Logged Out");
    }

    const [chats, setChats] = useState<Chats[] | null>(null);
    async function fetchChats() {
        const token = Cookies.get('token');
        try {
            const data = await chatApi.all();
            setChats(data.chats);
        } catch (error) {
            console.log(error);
        }
    }

    const [users, setUsers] = useState<User[] | null>(null);
    async function fetchUsers() {
        const token = Cookies.get('token');
        try {
            const data = await userApi.fetchAll();
            setUsers(data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchUser();
        fetchChats();
        fetchUsers();
    }, []);

    return (<AppContext.Provider value={{ user, setUser, isAuth, setIsAuth, loading, logoutUser, fetchChats, fetchUsers, chats, users, setChats }}>
        {children}
        <Toaster />
    </AppContext.Provider>)
}

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useappdata must be used withing AppProvider");
    }
    return context;
}