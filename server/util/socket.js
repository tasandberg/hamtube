const PLAYER_STATES = require("../lib/playerStates")
const getNumberWithOrdinal = require("./numberHelper")
const { KaraokeRoom, KARAOKE_EVENTS } = require("../lib/KaraokeRoom")
const _ = require("lodash")

/**
 * Dictionary of songQueues by RoomID
 * Individual SongQueue Shape:
 *  roomId: [
 *    { singerId: socketId, videoData: videoData}
 *  ]
 */
const karaokeRooms = {}

const initializeRoom = (roomId) => {
  karaokeRooms[roomId] = karaokeRooms[roomId] || new KaraokeRoom(roomId)
  return karaokeRooms[roomId]
}

module.exports = function (server) {
  const io = require("socket.io")(server)
  io.sockets.on("error", (e) => console.log(e))

  const onConnection = (socket) => {
    const roomId = socket.handshake.query.room
    const room = initializeRoom(roomId)

    room.addUser(socket)

    socket.join(roomId)

    console.log("Connection to room %s with ID: %s", roomId, socket.id)

    /**
     * General Use Room Functions
     */
    const notifyRoom = (message, excludeUser = false) => {
      let emitter = excludeUser ? socket.to(roomId) : io.to(roomId)
      emitter.emit("notification", {
        message,
      })
    }

    /**
     * Song Queue Functions
     */
    const broadcastRoomData = (socketId) => {
      const emitter = socketId ? io.to(socketId) : io.to(roomId)
      emitter.emit("room-data", room.roomData())
    }

    // NOW_PLAYING Handler
    const onNowPlaying = ({ message, data }) => notifyRoom(message, data)
    room.on(KARAOKE_EVENTS.NOW_PLAYING, onNowPlaying)

    // On Client Player Ready
    socket.on("player-ready", () => {
      // If song is playing in room, tell client to play
      if (room.songIsPlaying()) {
        videoControl(PLAYER_STATES.PLAYING, socket)
      }
      // Otherwise, let room know client is ready
      else {
        room.updateAwaitingClients(socket)
      }
    })

    const videoControl = (code, socket = null) => {
      const emitter = socket ? socket : io.to(roomId)
      emitter.emit("video-control", code)
    }

    socket.on("disconnect", function () {
      console.log("Disconnecting ", socket.id)
      room.removeUser(socket)
      io.to(roomId).emit("destroy", socket.id)
    })

    socket.on("disconnect-video", function () {
      socket.to(roomId).emit("disconnect-video", socket.id)
    })

    socket.on("video-position", (data) => {
      room.videoPosition = data // Can we skip this?
      io.to(roomId).emit("video-position", data)
    })

    socket.on("song-ended", () => {
      console.log("Song ended, cycling queue...")
      videoControl(PLAYER_STATES.ENDED)
      room.cycleSong()
    })

    socket.on("add-song", (data) => {
      room.addToSongQueue(data, socket.id)
    })

    // Room Event Handlers
    const onSongAdded = ({ message, data }) => {
      // Send event to all except user who added song
      notifyRoom(message, true)

      // Send success feedback to user
      const placeInLine = getNumberWithOrdinal(room.songQueue.length)
      socket.emit("song-added-success", {
        message: `Song added. It's ${placeInLine} in line. 🔥`,
      })

      io.to(roomId).emit("room-data", data)
    }
    room.on(KARAOKE_EVENTS.SONG_ADDED, onSongAdded)

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
