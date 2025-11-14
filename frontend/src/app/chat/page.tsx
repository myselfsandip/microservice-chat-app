"use client"

import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatSidebar from '@/components/ChatSidebar';
import Loading from '@/components/Loading';
import MessageInput from '@/components/MessageInput';
import { useAppData, User } from '@/context/AppContext'
import { SocketData } from '@/context/SocketContext';
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

export interface SendMessageFormType {
    chatId: string;
    text?: string;
    image?: File;
}

const ChatApp = () => {
    const { isAuth, loading, logoutUser, chats, user: loggedInUser, users, fetchChats, setChats } = useAppData();
    const { onlineUsers, socket } = SocketData();


    const router = useRouter();

    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [sidebarOpen, setsidebarOpen] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [user, setuser] = useState<User | null>(null);
    const [showAllUsers, setshowAllUsers] = useState<boolean>(false);
    const [isTyping, setisTyping] = useState<boolean>(false);
    const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuth && !loading) {
            router.push("/login");
        }
    }, [isAuth, loading, router]);

    async function fetchChat() {
        try {
            const data = await chatApi.fetchMessages(selectedUser);
            setMessages(data.messages);
            setuser(data.user);
            await fetchChats();
        } catch (error) {
            console.log(error);
            toast.error("Failed to load messages");
        }
    }

    const moveChatToTop = (chatId: string, newMessage: any, updatedUnseenCount = true) => {
        setChats((prev) => {
            if (!prev) return null;

            const updatedChats = [...prev]
            const chatIndex = updatedChats.findIndex(
                (chat) => chat.chat._id = chatId
            );

            if (chatIndex !== -1) {
                const [moveChat] = updatedChats.splice(chatIndex, 1);

                const updatedChat = {
                    ...moveChat,
                    chat: {
                        ...moveChat.chat,
                        latestMessage: {
                            text: newMessage.text,
                            senderId: newMessage.sender
                        },
                        updatedAt: new Date().toString(),
                        unseenCount: updatedUnseenCount && newMessage.sender !== loggedInUser?._id ? (moveChat.chat.unseenCount || 0) + 1 : moveChat.chat.unseenCount || 0,
                    }
                }
                updatedChats.unshift(updatedChat);
            }
            return updatedChats;
        })
    }

    const resetUnseenCount = (chatId: string) => {
        setChats((prev) => {
            if (!prev) return null;

            return prev.map((chat) => {
                if (chat.chat._id === chatId) {
                    return {
                        ...chat,
                        chat: {
                            ...chat.chat,
                            unseenCount: 0
                        }
                    }
                }
                return chat;
            })
        })
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

    const handleMessageSend = async (e: any, imageFile?: File | null) => {
        e.preventDefault();
        if (!message.trim() && !imageFile) return;
        if (!selectedUser) return;

        //socket work
        if (typingTimeOut) {
            clearTimeout(typingTimeOut);
            setTypingTimeOut(null);
        }

        socket?.emit("stoppedTyping", {
            chatId: selectedUser,
            userId: loggedInUser?._id,
        });

        try {
            const formData = new FormData();
            formData.append("chatId", selectedUser);
            if (message.trim()) {
                formData.append("text", message);
            }
            if (imageFile) {
                formData.append("image", imageFile);
            }

            const data = await chatApi.sendMessage(formData);

            setMessages((prev) => {
                const currentMessages = prev || [];
                const messageExists = currentMessages.some(
                    (msg) => msg._id === data.message._id
                )

                if (!messageExists) {
                    return [...currentMessages, data.message];
                }
                return currentMessages;
            });

            setMessage("");

            const displayText = imageFile ? "📷" : message;

            moveChatToTop(selectedUser!, {
                text: displayText,
                sender: data.sender
            }, false);
        } catch (error: any) {
            toast.error(error.response.data.message);
        }
    }
    const handleTyping = (value: string) => {
        setMessage(value);
        if (!selectedUser || !socket) return;
        //Socket Setup
        if (value.trim()) {
            socket.emit("typing", {
                chatId: selectedUser,
                userId: loggedInUser?._id,
            })
        }

        if (typingTimeOut) {
            clearTimeout(typingTimeOut);
        }

        const timeout = setTimeout(() => {
            socket.emit("stoppedTyping", {
                chatId: selectedUser,
                userId: loggedInUser?._id,
            })
        }, 2000);

        setTypingTimeOut(timeout);
    }

    useEffect(() => {

        socket?.on("newMessage", (message) => {
            console.log("Received new Message:", message);
            if (selectedUser === message.chatId) {
                setMessages((prev) => {
                    const currentMessages = prev || [];
                    const messageExists = currentMessages.some(
                        (msg) => msg._id === message._id
                    )

                    if (!messageExists) {
                        return [...currentMessages, message]
                    }
                    return currentMessages;
                });
                moveChatToTop(message.chatId, message, false);
            } else {
                moveChatToTop(message.chatId, message, true);
            }
        });

        socket?.on("messagesSeen", (data) => {
            console.log("Message seen by:", data);

            if (selectedUser === data.chatId) {
                setMessages((prev) => {
                    if (!prev) return null;
                    return prev.map((msg) => {
                        if (msg.sender === loggedInUser?._id && data.messageIds && data.messageIds.includes(msg._id)) {
                            return {
                                ...msg,
                                seen: true,
                                seenAt: new Date().toString()
                            }
                        } else if (msg.sender === loggedInUser?._id && !data.messageIds) {
                            return {
                                ...msg,
                                seen: true,
                                seenAt: new Date().toString()
                            }
                        }
                        return msg;
                    })
                })
            }
        })

        socket?.on("userTyping", (data) => {
            console.log("received user typing", data);
            if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
                setisTyping(true);
            }
        });

        socket?.on("userStoppedTyping", (data) => {
            console.log("received user stopped typing", data);
            if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
                setisTyping(false);
            }
        });

        return () => {
            socket?.off("newMessage");
            socket?.off("messagesSeen");
            socket?.off("userTyping");
            socket?.off("userStoppedTyping");
        }
    }, [socket, selectedUser, setChats, loggedInUser?._id]);

    useEffect(() => {
        if (selectedUser) {
            fetchChat();
            setisTyping(false);
            resetUnseenCount(selectedUser);
            socket?.emit("joinChat", selectedUser);
            return () => {
                socket?.emit("leaveChat", selectedUser);
                setMessages(null);
            }
        }
    }, [selectedUser, socket]);

    useEffect(() => {
        return () => {
            if (typingTimeOut) {
                clearTimeout(typingTimeOut);
            }
        }
    }, [typingTimeOut]);


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
                onlineUsers={onlineUsers}
            />

            {/* Chat Header */}
            <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 ">
                <ChatHeader user={user} setSidebarOpen={setsidebarOpen} isTyping={isTyping} onlineUsers={onlineUsers} />
                <ChatMessages selectedUser={selectedUser} messages={messages} loggedInUser={loggedInUser} />
                <MessageInput selectedUser={selectedUser} message={message} setMessage={handleTyping} handleMessageSend={handleMessageSend} />
            </div>
        </div>
    )
}

export default ChatApp;