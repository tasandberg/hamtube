const youtubedl = require("youtube-dl")
const _ = require("lodash")

let peers = []

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))
  console.log("fart")
  io.on("connection", (socket) => {
    console.log("Connection with ID: %s", socket.id)
    const peersToAdvertise = _.chain(io.sockets.connected)
      .values()
      .without(socket)
      .value()

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

    socket.on("signal", function (data) {
      var socket2 = io.sockets.connected[data.peerId]
      if (!socket2) {
        return
      }
      console.log("Proxying signal from peer %s to %s", socket.id, socket2.id)

      socket2.emit("signal", {
        signal: data.signal,
        peerId: socket.id,
      })
    })

    socket.on("set-name", (name) => {
      const peerIndex = peers.findIndex((p) => p.id === socket.id)
      peers[peerIndex] = { id: socket.id, name: name }
      console.log(peers)
      console.log(name, "set name")
      socket.emit("client-list", peers)
      socket.broadcast.emit("client-list", peers)
    })
  })
}
