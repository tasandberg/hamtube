const getNumberWithOrdinal = require("../util/numberHelper")
const PLAYER_STATES = require("../lib/playerStates")
const {
  initKaraokeUserSocket,
  teardownKaraokeUserSocket,
} = require("./karaoke-user-socket")
const debug = require("debug")("KaraokeRoom")

/**
 * Room Class:
 * Attributes:
 * * Song Queue <Song[]>
 * * nowPlaying <Song>
 * * videoPosition
 * * users <Socket
 *
 * API:
 * * Add song
 * * Play (todo: auto play for now)
 * * Stop (todo)
 *
 * Events:
 * * 'now-playing': new song has been moved to playing position (room data)
 * * 'song-added': new song added to queue (room data)
 * * 'empty-queue': no more songs left in queue (room data)
 * * 'clients-ready': all clients have loaded
 *
 */

class KaraokeRoom {
  constructor(props) {
    const requiredProps = ["id", "io"]
    requiredProps.forEach((prop) => {
      if (!props[prop]) {
        throw new Error(`KaraokeRoom requires ${prop}`)
      }
    })

    this.id = props.id
    this.io = props.io
    this.songQueue = []
    this.nowPlaying = null
    this.videoPosition = 0
    this.users = {}
    this.awaitingClients = null
    this.playerStatus = PLAYER_STATES.UNSTARTED
  }

  addUser = (socket) => {
    socket.join(this.id)
    initKaraokeUserSocket(socket, this)
    this.users[socket.id] = socket
    debug("Added user %s. %s total", socket.id, Object.keys(this.users).length)
  }

  removeUser = (socket) => {
    teardownKaraokeUserSocket(socket)
    delete this.users[socket.id]
  }

  addToSongQueue = (videoData, userId) => {
    this.songQueue.push({
      singerId: userId,
      videoData,
    })

    this.notifyRoom(
      `A new song was just added to the queue 👻 (${this.songQueue.length} total)`
    )

    // Send success feedback to user
    const placeInLine = getNumberWithOrdinal(this.songQueue.length)
    this.users[userId].emit("song-added-success", {
      message: `Song added. It's ${placeInLine} in line. 🔥`,
    })

    this.sendRoomData(this.roomData())
  }

  roomData = () => ({
    currentSong: this.nowPlaying,
    currentSinger: this.nowPlaying ? this.nowPlaying.singerId : null,
    upNext: this.songQueue[0],
    position: this.videoPosition,
  })

  songIsPlaying = () => {
    return this.playerStatus === PLAYER_STATES.PLAYING
  }

  // Remove and return song at top of queue
  advanceQueue = () => {
    this.videoPosition = 0
    this.nowPlaying = this.songQueue.shift()
    return this.nowPlaying
  }

  refreshAwaitingClients = () => {
    this.awaitingClients = Object.keys(this.users)
  }

  updateAwaitingClients = (socket) => {
    if ((this.playerStatus = PLAYER_STATES.PLAYING)) {
      throw new Error("Cannot update awaiting clients if song is playing")
    } else {
      this.awaitingClients = this.awaitingClients.filter(
        (id) => id !== socket.id
      )
      // If waiting list is now empty, set status to PLAYING and emit CLIENTS_READY
      if (this.awaitingClients.length === 0) {
        this.playerStatus = PLAYER_STATES.PLAYING
        this.notifyRoom("Get ready to sing!")
      } else {
        debug("Still waiting on %s clients", this.awaitingClients.length)
      }
    }
  }

  cycleSong = (cb) => {
    this.playerStatus = PLAYER_STATES.UNSTARTED

    const currentSong = this.advanceQueue()

    if (currentSong) {
      this.refreshAwaitingClients()
      this.notifyRoom(`Now playing: ${currentSong.videoData.title}`)
    } else {
      this.notifyRoom(`Song Queue is empty. Add more!`)
      return false
    }
  }

  playVideo = (socket = null) => {
    this.#videoControl(PLAYER_STATES.PLAYING, socket)
  }

  stopVideo = (socket = null) => {
    this.#videoControl(PLAYER_STATES.ENDED, socket)
  }

  #videoControl = (code, socket = null) => {
    const emitter = socket ? socket : this.io.to(this.id)
    emitter.emit("video-control", code)
  }

  notifyRoom = (message) => {
    this.io.to(this.id).emit("notification", {
      message,
    })
  }

  sendRoomData = (data) => {
    this.io.to(this.id).emit("room-data", data)
  }
}

module.exports = {
  KaraokeRoom,
}
