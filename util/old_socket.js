const youtubedl = require("youtube-dl")
let broadcaster

let peers = []

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))

  io.sockets.on("connection", (socket) => {
    peers.push({ id: socket.id, name: "" })
    socket.broadcast.emit("client-list", peers)

    socket.on("broadcaster", () => {
      broadcaster = socket.id
      console.log(broadcaster, "broadcaster")

      socket.broadcast.emit("broadcaster")
    })

    socket.on("set-name", (name) => {
      const peerIndex = peers.findIndex((p) => p.id === socket.id)
      peers[peerIndex] = { id: socket.id, name: name }
      console.log(peers)
      console.log(name, "set name")
      socket.emit("client-list", peers)
      socket.broadcast.emit("client-list", peers)
    })

    socket.on("watcher", () => {
      console.log(socket.id, "watcher received")
      socket.to(broadcaster).emit("watcher", socket.id)
    })

    socket.on("disconnect", (args) => {
      peers = peers.filter((p) => p.id !== socket.id)
      console.log(socket.id, "disconnected")
      console.log(peers, "remaining peers")
      socket.broadcast.emit("client-list", peers)
      socket.to(broadcaster).emit("disconnectPeer", socket.id)
    })
    socket.on("offer", (id, message) => {
      console.log(`Offer: ${socket.id} offering to ${id}`)
      socket.to(id).emit("offer", socket.id, message)
    })
    socket.on("answer", (id, message) => {
      console.log(`Answer: ${socket.id} answering to ${id}`)
      socket.to(id).emit("answer", socket.id, message)
    })
    socket.on("candidate", (id, message) => {
      console.log(`Candidate: ${socket.id} sending candidate to ${id}`)
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
