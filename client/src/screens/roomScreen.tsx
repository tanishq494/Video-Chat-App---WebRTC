import { useSocket } from "../context/socketProvider"
import { useEffect, useCallback, useState, useRef } from "react"
import peer from "../services/peer";

const RoomScreen = () => {
    const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null)
    const [myStream, setMyStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const socket = useSocket()
    const videoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)

    const handleUserJoined = useCallback(
        (data: { email: string; Id: string }) => {
            console.log(`User ${data.email} joined room ${data.Id}`)
            setRemoteSocketId(data.Id)
        },
        []
    )

    const handleIncommingCall = useCallback(
        async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );

    const handleCallUser = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            })
            const offer = await peer.getOffer();
            socket.emit("user:call", { to: remoteSocketId, offer });
            setMyStream(stream)

        } catch (error) {
            console.error("Error accessing camera/microphone:", error)
        }
    }, [setMyStream, remoteSocketId, socket])

    // Attach MediaStream to video element
    useEffect(() => {
        if (videoRef.current && myStream) {
            videoRef.current.srcObject = myStream
        }
    }, [myStream])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // Stop camera/microphone when leaving the page
    useEffect(() => {
        return () => {
            myStream?.getTracks().forEach((track) => track.stop())
        }
    }, [myStream])

    // FIX: skip tracks that were already added (addTrack throws on duplicates)
    const sendStreams = useCallback(() => {
        if (!myStream) return;

        const senders = peer.peer.getSenders();
        for (const track of myStream.getTracks()) {
            if (!senders.some((s) => s.track === track)) {
                peer.peer.addTrack(track, myStream);
            }
        }
    }, [myStream]);

    // FIX: async + await so the remote description is set before adding tracks
    const handleCallAccepted = useCallback(
        async ({ ans }: { from: string; ans: RTCSessionDescriptionInit }) => {
            await peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams();
        },
        [sendStreams]
    );

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    // FIX: main bug - this returned a function that never ran, so the answer was never sent
    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }: { ans: RTCSessionDescriptionInit }) => {
        await peer.setLocalDescription(ans);
    }, []);

    // FIX: added cleanup for the track listener
    useEffect(() => {
        const onTrack = (ev: RTCTrackEvent) => {
            console.log("GOT TRACKS!!");
            setRemoteStream(ev.streams[0]);
        };
        peer.peer.addEventListener("track", onTrack);
        return () => {
            peer.peer.removeEventListener("track", onTrack);
        };
    }, []);

    // FIX: ICE candidate exchange (send)
    useEffect(() => {
        const onIce = (e: RTCPeerConnectionIceEvent) => {
            if (e.candidate && remoteSocketId) {
                socket.emit("ice:candidate", { to: remoteSocketId, candidate: e.candidate });
            }
        };
        peer.peer.addEventListener("icecandidate", onIce);
        return () => {
            peer.peer.removeEventListener("icecandidate", onIce);
        };
    }, [socket, remoteSocketId]);

    // FIX: ICE candidate exchange (receive)
    const handleRemoteCandidate = useCallback(
        async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            try {
                await peer.peer.addIceCandidate(candidate);
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        },
        []
    );

    // FIX: full deps + ice:candidate listener
    useEffect(() => {
        socket.on("user:joined", handleUserJoined)
        socket.on("incomming:call", handleIncommingCall)
        socket.on("call:accepted", handleCallAccepted)
        socket.on("peer:nego:needed", handleNegoNeedIncomming)
        socket.on("peer:nego:final", handleNegoNeedFinal)
        socket.on("ice:candidate", handleRemoteCandidate)

        return () => {
            socket.off("user:joined", handleUserJoined)
            socket.off("incomming:call", handleIncommingCall)
            socket.off("call:accepted", handleCallAccepted)
            socket.off("peer:nego:needed", handleNegoNeedIncomming)
            socket.off("peer:nego:final", handleNegoNeedFinal)
            socket.off("ice:candidate", handleRemoteCandidate)
        }
    }, [
        socket,
        handleUserJoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncomming,
        handleNegoNeedFinal,
        handleRemoteCandidate,
    ])

    return (
        <div>
            <h1>Room Page</h1>

            <h4>
                {remoteSocketId
                    ? `Remote user connected: ${remoteSocketId}`
                    : "No remote user"}
            </h4>

            {myStream && (
                <button onClick={sendStreams}>
                    Send Stream
                </button>)
            }

            {remoteSocketId && (
                <button onClick={handleCallUser}>
                    CALL
                </button>
            )}

            {myStream && (
                <>
                    <h1>My Stream</h1>

                    {/* FIX: muted only on the local video (prevents echo) */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: "400px",
                            height: "300px",
                            backgroundColor: "black",
                        }}
                    />
                </>
            )}

            {remoteStream && (
                <>
                    <h1>Remote Stream</h1>

                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: "400px",
                            height: "300px",
                            backgroundColor: "black",
                        }}
                    />
                </>
            )}
        </div>
    )
}

export default RoomScreen