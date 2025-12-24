import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_API_URL, {
            withCredentials: true,
        });
    }

    return socket;
};

export const getSocket = () => socket;
