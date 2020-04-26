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
  constructor({ id, io }) {
    this.id = id
    this.io = io
    this.songQueue = []
    this.nowPlaying = null
    this.videoPosition = 0
    this.users = []
    this.awaitingClients = null
  }

  addToSongQueue = (videoData, userId, cb) => {
    this.songQueue.push({
      singerId: userId,
      videoData,
    })

    if (cb) {
      cb(this.roomData())
    }
  }

  roomData = () => ({
    currentSong: this.nowPlaying,
    currentSinger: this.nowPlaying ? this.nowPlaying.singerId : null,
    upNext: this.songQueue[0],
    position: this.videoPosition,
  })

  songIsPlaying = () => {
    return !!this.nowPlaying
  }

  // Remove and return song at top of queue
  advanceQueue = () => {
    this.videoPosition = 0
    this.nowPlaying = this.songQueue.shift()
    return this.nowPlaying
  }

  refreshAwaitingClients = () => {
    this.awaitingClients = this.users.map((socket) => socket.id)
  }

  cycleSong = (cb) => {
    const currentSong = this.advanceQueue()

    if (currentSong) {
      this.refreshAwaitingClients()
      cb &&
        cb({
          message: `Now playing: ${currentSong.videoData.title}`,
          roomData: this.roomData(),
        })
      return true
    } else {
      cb &&
        cb({
          message: `No songs left in Queue. Add more!`,
          roomData: this.roomData(),
        })
      return false
    }
  }
}
