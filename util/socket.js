// const youtubedl = require("youtube-dl")

const getNumberWithOrdinal = require("./numberHelper")
const _ = require("lodash")

/**
 * Dictionary of songQueues by RoomID
 * Individual SongQueue Shape:
 *  roomId: [
 *    { singerId: socketId, videoData: videoData}
 *  ]
 */
const songQueues = {}

function initializeSongQueue(roomId) {
  if (songQueues[roomId]) return
  songQueues[roomId] = []
}

function addToSongQueue(roomId, videoData, singerId) {
  songQueues[roomId].push({ singerId, videoData })
}

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))

  const onConnection = (socket) => {
    const roomId = socket.handshake.query.room

    socket.join(roomId)
    initializeSongQueue(roomId)

    console.log("Connection to room %s with ID: %s", roomId, socket.id)

    /**
     * Peer Signaling Connections
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

    /**
     * Song Queue Functions
     */

    const addToSongQueue = (videoData) => {
      songQueues[roomId].push({ singerId: socket.id, videoData })
    }

    // Event Handlers

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

    socket.on("add-song", (data) => {
      addToSongQueue(data)
      console.log(
        `Song added for room ${roomId}. ${songQueues[roomId].length} total.`
      )

      // Send event to all except user who added song
      socket.to(roomId).emit("notification", {
        message: `A new song was just added to the queue 👻 (${songQueues[roomId].length} total)`,
      })

      io.to(socket.id).emit("song-added-success", {
        message: `Song added. It's ${getNumberWithOrdinal(
          songQueues[roomId].length
        )} in line. 🔥`,
      })
    })
  }

  io.on("connection", onConnection)
}
