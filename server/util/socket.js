const PLAYER_STATES = require("../lib/playerStates")
const getNumberWithOrdinal = require("./numberHelper")
const { KaraokeRoom, KARAOKE_EVENTS } = require("../lib/KaraokeRoom")
const _ = require("lodash")
const debug = require('debug')('socket')

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
    let room = initializeRoom(roomId)

    room.addUser(socket)

    socket.join(roomId)

    console.log("Connection to room %s with ID: %s", roomId, socket.id)

    /**
     * General Use Room Functions
     */
    const notifyRoom = (message, data) => {
      io.to(roomId).emit("notification", {
        message,
        data
      })
    }

    const broadcastRoomData = (socketId) => {
      const emitter = socketId ? io.to(socketId) : io.to(roomId)
      emitter.emit("room-data", room.roomData())
    }

    const videoControl = (code, socket = null) => {
      const emitter = socket ? socket : io.to(roomId)
      emitter.emit("video-control", code)
    }

    /**
     * Room Event Handlers
     */

    // SONG_ADDED
    room.on(KARAOKE_EVENTS.SONG_ADDED, ({ message, data }) => {
      // Send event to all except user who added song
      notifyRoom(message, true)

      // Send success feedback to user
      const placeInLine = getNumberWithOrdinal(room.songQueue.length)
      socket.emit("song-added-success", {
        message: `Song added. It's ${placeInLine} in line. 🔥`,
      })

      io.to(roomId).emit("room-data", data)

      if (room.nowPlaying === null) room.cycleSong()
    })

    // NOW_PLAYING
    room.on(KARAOKE_EVENTS.NOW_PLAYING, ({ message, data }) => notifyRoom(message, data))

    // CLIENTS_READY
    room.on(KARAOKE_EVENTS.CLIENTS_READY, ({ message, data }) => {
      debug('CLIENTS_READY, sending Play state')
      videoControl(PLAYER_STATES.PLAYING)
    })

    /**
     * On Client Player Ready:
     * If song is playing in room, tell client to play.
     * Otherwise, let room know client is ready.
     *
     */
    socket.on("player-ready", () => {
      room.updateAwaitingClients(socket)

      if (room.isSongPlaying()) {
        console.log('song playing, send play')
        videoControl(PLAYER_STATES.PLAYING, socket)
      } else {
        console.log('Player ready, updating awaitingClients')
      }
    })

    socket.on("disconnect", function () {
      console.log("Disconnecting ", socket.id)
      room.updateAwaitingClients(socket)
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
      room.endSong()
    })

    socket.on("add-song", (data) => {
      room.addToSongQueue(data, socket.id)
    })

    socket.on("skip-song", (data) => {
      if (room.nowPlaying.singerId === socket.id) {
        debug("Singer requested song skip. Skipping.")
        room.endSong()
      }
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

    if (room.isSongPlaying()) {
      console.log("Song is playing, sending room data to new user")
      broadcastRoomData(socket.id)
    }
  }

  io.on("connection", onConnection)
}
