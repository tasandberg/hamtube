const { KaraokeRoom } = require("../lib/KaraokeRoom")
const _ = require("lodash")

/**
 * Dictionary of songQueues by RoomID
 * Individual SongQueue Shape:
 *  roomId: [
 *    { singerId: socketId, videoData: videoData}
 *  ]
 */
const karaokeRooms = {}

const initializeRoom = (roomId, io) => {
  karaokeRooms[roomId] =
    karaokeRooms[roomId] || new KaraokeRoom({ id: roomId, io: io })
  return karaokeRooms[roomId]
}

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))

  const onConnection = (socket) => {
    const roomId = socket.handshake.query.room
    const room = initializeRoom(roomId)

    room.addUser(socket)

    console.log("Connection to room %s with ID: %s", roomId, socket.id)

    /**
     * Song Queue Functions
     */
    const broadcastRoomData = (socketId) => {
      const emitter = socketId ? io.to(socketId) : io.to(roomId)
      emitter.emit("room-data", room.roomData())
    }

    socket.on("disconnect", function () {
      console.log("Disconnecting ", socket.id)
      room.removeUser(socket)
      io.to(roomId).emit("destroy", socket.id)
    })

    socket.on("disconnect-video", function () {
      socket.to(roomId).emit("disconnect-video", socket.id)
    })

    /**
     * WebRTC Signalling
     */
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

    /**
     * Initialization:
     *  1. Peer signaling connections for WebRTC
     *  2. Broadcast room data if appropriate
     */
    const connectedSocketIds = Object.keys(
      io.sockets.adapter.rooms[roomId].sockets
    ).filter((id) => id !== socket.id)
    const connectedSockets = _.pick(io.sockets.connected, connectedSocketIds)

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

    if (room.songIsPlaying()) {
      console.log("Song is playing, sending room data to new user")
      broadcastRoomData(socket.id)
    }
  }

  io.on("connection", onConnection)
}
