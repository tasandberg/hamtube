const youtubedl = require("youtube-dl")
let broadcaster

let peers = []

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))
  io.sockets.on("connection", (socket) => {
    peers.push(socket.id)
    socket.emit("client-list", peers)

    socket.on("broadcaster", () => {
      broadcaster = socket.id
      console.log(socket.id, "broadcaster")

      socket.broadcast.emit("broadcaster")
    })

    socket.on("watcher", () => {
      socket.to(broadcaster).emit("watcher", socket.id)
    })
    socket.on("disconnect", (args) => {
      peers = peers.filter((id) => id !== socket.id)
      console.log(socket.id, "disconnected")
      socket.emit("client-list", peers)
      socket.to(broadcaster).emit("disconnectPeer", socket.id)
    })
    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message)
    })
    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message)
    })
    socket.on("candidate", (id, message) => {
      socket.to(id).emit("candidate", socket.id, message)
    })

    socket.on("video-plz", (id) => {
      console.log(id, "video request from")
      youtubedl.getInfo(
        "https://www.youtube.com/watch?v=XdBR-SrP6uU",
        function (err, { url }) {
          if (err) throw err
          console.log("video data retrieved")

          socket.emit("video-data", url)
        }
      )
    })
  })
}
