import { Server } from "socket.io";

const io = new Server(8000, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const emailToSocketMap: Record<string, string> = {};
const socketToEmailMap: Record<string, string> = {};

io.on("connection", (socket) => {
  console.log("New connection", socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketMap[email] = socket.id;
    socketToEmailMap[socket.id] = email;
    io.to(room).emit("user:joined", { email, Id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:joined", data);
  });

  socket.on("user:call", ({ to, offer }) => {
  io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

});