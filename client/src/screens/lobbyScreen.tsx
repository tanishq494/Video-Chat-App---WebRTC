import { useState, useCallback, useEffect, type FormEvent } from 'react'
import { useSocket } from '../context/socketProvider'
import { useNavigate } from 'react-router'

const LobbyScreen = () => {
    const [email, setEmail] = useState("")
    const [room, setRoom] = useState("")

    const socket = useSocket()
    const navigate = useNavigate()

    const handleSubmitForm = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        socket.emit("room:join", { email, room });
    }, [email, room, socket])

    const handleJoinRoom = useCallback((data: { email: string, room: string }) => {
        const roomId = data.room.trim()
        if (!roomId) {
            return
        }

        navigate(`/room/${roomId}`)

    }, [navigate]);

    useEffect(() => {
        socket.on("room:joined", handleJoinRoom);

        return () => {
            socket.off("room:joined", handleJoinRoom);
        }
    }, [socket, handleJoinRoom]);

    return(
        <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmitForm}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email"
                     value={email} onChange={(e) => setEmail(e.target.value)} />
                <br />
                <label htmlFor="room">Room</label>
                <input type="number" id="room" name="room" 
                    value={room} onChange={(e) => setRoom(e.target.value)} />
                <br />
                <button>Join</button>
            </form>
        </div>
    )
}

export default LobbyScreen