/**
 * Room Class:
 * Attributes:
 * * Song Queue <Song[]>
 * * nowPlaying <Song>
 * * videoPosition
 * * users <Socket
 *
 */

export default class Room {
  constructor({ id }) {
    this.id = id
    this.songQueue = []
    this.nowPlaying = null
    this.videoPosition = 0
    this.users = []
  }

  //
  addToSongQueue = (videoData, userId, cb) => {
    songQueue.push({
      singerId: userId,
      videoData,
    })
    cb(songQueue.length)
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
  songIsPlaying = () => {
    return nowPlaying[roomId]
  }

  setNowPlaying = (videoData) => {
    console.log("Setting now playing")
    nowPlaying[roomId] = videoData
  }

  getSongQueue = () => {
    return songQueues[roomId]
  }

  getUpNext = () => {
    return getSongQueue()[0]
  }

  getNowPlaying = () => {
    return nowPlaying[roomId]
  }

  // Remove and return song at top of queue
  advanceQueue = () => {
    setNowPlaying(songQueues[roomId].shift())
    return getNowPlaying()
  }

  refreshAwaitingClients = () => {
    awaitingClients[roomId] = peers[roomId].map((socket) => socket.id)
  }

  cycleSong = () => {
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
}
