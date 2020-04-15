// const youtubedl = require("youtube-dl")
const _ = require("lodash")

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))

  const onConnection = (socket) => {
    const roomId = socket.handshake.query.room

    socket.join(roomId)

    console.log("Connection to room %s with ID: %s", roomId, socket.id)

    // Get all Socket IDs for given room
    const connectedSocketIds = Object.keys(
      io.sockets.adapter.rooms[roomId].sockets
    ).filter((id) => id !== socket.id)

    // Get Sockets for given room
    const connectedSockets = _.pick(io.sockets.connected, connectedSocketIds)

    // Connect new client with all peers in room
    _.forEach(connectedSockets, function (socket2) {
      console.log("Advertising peer %s to %s", socket.id, socket2.id)
      socket2.emit("peer", {
        peerId: socket.id,
        initiator: true,
      })

      socket.emit("peer", {
        peerId: socket2.id,
        initiator: false,
      })
    })

    socket.on("disconnect", function (peerId) {
      console.log("Disconnecting ", socket.id)
      console.log(
        Object.keys(io.sockets.connected).length,
        "clients connected to room " + roomId
      )
      io.to(roomId).emit("destroy", socket.id)
    })

    socket.on("disconnect-video", function () {
      socket.to(roomId).emit("disconnect-video", socket.id)
    })

    socket.on("signal", function (data) {
      var socket2 = io.sockets.connected[data.peerId]
      if (!socket2) {
        return
      }

      socket2.emit("signal", {
        signal: data.signal,
        peerId: socket.id,
      })
    })
  }

  io.on("connection", onConnection)
}
