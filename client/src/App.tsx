import {Routes, Route } from "react-router"
import LobbyScreen from "./screens/lobbyScreen"
import RoomScreen from "./screens/roomScreen"

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:roomId" element={<RoomScreen />} />
      </Routes>
    </div>
  )
}

export default App
