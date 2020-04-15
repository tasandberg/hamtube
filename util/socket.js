const db = require("../models/index.js")
const Chat = db.Chat
const _ = require("lodash")

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))

  /* Verify room  */
  io.use((socket, next) => {
    const roomId = socket.handshake.query.room
    Chat.findByPk(roomId)
      .then((data) => {
        socket.roomId = roomId
        return next()
      })
      .catch((e) => {
        return next(new Error("Unable to locate chat"))
      })
  })

  /* On Connect */
  io.on("connection", (socket) => {
    console.log("Client %s join room %s", socket.id, socket.roomId)
    const roomId = socket.roomId
    const emitter = io.to(roomId)

    socket.join(roomId)
    const peersToAdvertise = _.chain(io.sockets.connected)
      .values()
      .without(socket)
      .value()
    console.log(Object.keys(io.sockets.connected).length, "clients connected")

    console.log("advertising peers", _.map(peersToAdvertise, "id"))
    peersToAdvertise.forEach(function (socket2) {
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
      console.log(Object.keys(io.sockets.connected).length, "clients connected")
      emitter.emit("destroy", socket.id)
    })

    socket.on("disconnect-video", function () {
      socket.broadcast.emit("disconnect-video", socket.id)
    })

    socket.on("signal", function (data) {
      var socket2 = io.sockets.connected[data.peerId]
      if (!socket2) {
        return
      }
      // console.log("Proxying signal from peer %s to %s", socket.id, socket2.id)

      socket2.emit("signal", {
        signal: data.signal,
        peerId: socket.id,
      })
    })
  })
}
