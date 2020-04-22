// const youtubedl = require("youtube-dl")

const getNumberWithOrdinal = require("./numberHelper")
const _ = require("lodash")
const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
}

/**
 * Dictionary of songQueues by RoomID
 * Individual SongQueue Shape:
 *  roomId: [
 *    { singerId: socketId, videoData: videoData}
 *  ]
 */
const songQueues = {}
const nowPlaying = {}

// Position of video from singer's client, for syncing newcomers to room
const videoPosition = {}

const peers = {}
const awaitingClients = {}

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
    const peerList = (peers[roomId] = peers[roomId] || [])

    peerList.push(socket)

    socket.join(roomId)
    initializeSongQueue(roomId)

    console.log("Connection to room %s with ID: %s", roomId, socket.id)

    /**
     * General Use Room Functions
     */
    const notifyRoom = (message, excludeUser = false) => {
      let notifier = excludeUser ? socket.to(roomId) : io.to(roomId)
      notifier.emit("notification", {
        message,
      })
    }

    /**
     * Song Queue Functions
     */
    const addToSongQueue = (videoData) => {
      songQueues[roomId].push({
        singerId: socket.id,
        videoData,
      })
      const queueLength = songQueues[roomId].length

      console.log(`Song added for room ${roomId}. ${queueLength} total.`)

      // Send event to all except user who added song
      notifyRoom(
        `A new song was just added to the queue 👻 (${queueLength} total)`,
        true
      )

      // Send success feedback to user
      io.to(socket.id).emit("song-added-success", {
        message: `Song added. It's ${getNumberWithOrdinal(
          songQueues[roomId].length
        )} in line. 🔥`,
      })

      if (!nowPlaying[roomId]) {
        cycleSong()
      }

      broadcastRoomData()
    }

    const broadcastRoomData = (socketId) => {
      const currentSong = getNowPlaying()

      const emitter = socketId ? io.to(socketId) : io.to(roomId)

      emitter.emit("room-data", {
        currentSong,
        currentSinger: currentSong && currentSong.singerId,
        upNext: getUpNext(),
        position: videoPosition[roomId],
      })
    }

    const songIsPlaying = () => {
      return nowPlaying[roomId]
    }

    const setNowPlaying = (videoData) => {
      console.log("Setting now playing")
      nowPlaying[roomId] = videoData
    }

    const getSongQueue = () => {
      return songQueues[roomId]
    }

    const getUpNext = () => {
      return getSongQueue()[0]
    }

    const getNowPlaying = () => {
      return nowPlaying[roomId]
    }

    // Remove and return song at top of queue
    const advanceQueue = () => {
      setNowPlaying(songQueues[roomId].shift())
      return getNowPlaying()
    }

    const refreshAwaitingClients = () => {
      awaitingClients[roomId] = peers[roomId].map((socket) => socket.id)
    }

    const cycleSong = () => {
      console.log("Cycling songs")
      videoPosition[roomId] = 0
      const currentSong = advanceQueue()

      if (currentSong) {
        notifyRoom(`Now playing: ${currentSong.videoData.title}`)
        refreshAwaitingClients()
      } else {
        console.log("No more songs")
      }
      broadcastRoomData()
    }

    socket.on("player-ready", () => {
      // Remove this user from awaiting clients

      if (awaitingClients[roomId]) {
        const filteredAwaiting = awaitingClients[roomId].filter(
          (id) => id !== socket.id
        )

        awaitingClients[roomId] = filteredAwaiting
        console.log(awaitingClients[roomId], "awaiting clients")

        if (awaitingClients[roomId].length === 0) {
          console.log("All clients loaded, playing video")

          videoControl(PlayerState.PLAYING)
        } else {
          console.log("Waiting on %s clients", awaitingClients[roomId].length)
        }
      } else {
        if (getNowPlaying()) {
          broadcastRoomData(socket.id)
          videoControl(PlayerState.PLAYING)
        }
      }
    })

    const videoControl = (code) => {
      io.to(roomId).emit("video-control", code)
    }

    // Get Client Latency
    // Call callback with results
    // function pingClients(callback) {
    //   const pings = []
    //   const peerList = peers[roomId].map((p) => p)
    //   console.log("Pinging %s peers", peerList.length)

    //   peerList.forEach((sock) => {
    //     const start = Date.now()

    //     sock.emit("ping", "plz pong", (pong) => {
    //       pings.push((Date.now() - start) / 2)

    //       if (pings.length === peerList.length) {
    //         callback(pings)
    //       }
    //     })
    //   })
    // }

    socket.on("disconnect", function () {
      console.log("Disconnecting ", socket.id)
      const updatedPeers = peers[roomId].filter((s) => s.id !== socket.id)
      peers[roomId] = updatedPeers

      io.to(roomId).emit("destroy", socket.id)
    })

    socket.on("disconnect-video", function () {
      socket.to(roomId).emit("disconnect-video", socket.id)
    })

    socket.on("video-position", (data) => {
      videoPosition[roomId] = data
      io.to(roomId).emit("video-position", data)
    })

    socket.on("song-ended", () => {
      console.log("Song ended, cycling queue...")
      videoControl(PlayerState.ENDED)
      cycleSong()
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

    if (songIsPlaying()) {
      console.log("Song is playing, sending room data to new user")
      broadcastRoomData(socket.id)
    }
  }

  io.on("connection", onConnection)
}
