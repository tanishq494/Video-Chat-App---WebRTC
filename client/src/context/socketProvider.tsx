import {createContext, useContext, useMemo} from "react";
import { io, Socket } from "socket.io-client";


const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    const socket = useContext(SocketContext);
    if (!socket) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return socket;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = useMemo(() => io("http://localhost:8000"), []);
    return(
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}