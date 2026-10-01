# Video Chat App

A real-time peer-to-peer video calling app. Users join a room with their email and a room ID and connect directly over WebRTC.

## Features

- Join rooms by email + room ID
- Peer-to-peer audio/video calls over WebRTC
- Socket.IO signaling server relaying offers, answers, and renegotiation events
- Camera/microphone capture, track streaming, and stream cleanup
- Reusable `PeerService` wrapping `RTCPeerConnection` with STUN-based ICE

## Tech Stack

- **Client:** React, TypeScript, React Router
- **Server:** Node.js, TypeScript, Socket.IO
- **Real-time:** WebRTC (STUN for ICE)

## Project Structure

```
├── client/   # React + TypeScript app (room screen, PeerService)
└── server/   # Node.js + TypeScript Socket.IO signaling server
```

## Getting Started

### Prerequisites

- Node.js (LTS)
- A browser with camera/microphone access

### Setup

```bash
git clone https://github.com/tanishq494/Video-Chat-App---WebRTC.git
cd Video-Chat-App---WebRTC
```

Start the server:

```bash
cd server
npm install
npm run dev
```

Start the client (new terminal):

```bash
cd client
npm install
npm run dev
```

Open the client URL in two browser tabs (or two devices), join the same room ID, and start the call.

## How It Works

1. Both users join a room via the signaling server (Socket.IO).
2. The caller creates an SDP offer; the server relays it to the other peer.
3. The callee returns an answer; ICE candidates are exchanged via STUN.
4. Media streams flow directly between peers, not through the server.

## Limitations

- STUN only (no TURN server), so calls may fail behind strict NATs/firewalls.
- Designed for one-to-one calls.