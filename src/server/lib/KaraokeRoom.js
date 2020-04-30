const getNumberWithOrdinal = require("../util/numberHelper")
const PLAYER_STATES = require("./playerStates")
const Room = require("../../../models/index").Room
const moment = require("moment")

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
    console.log("constructor called")

    requiredProps.forEach((prop) => {
      if (!props[prop]) {
        throw new Error(`KaraokeRoom requires ${prop}`)
      }
    })
    this.id = props.id
    this.room = this.getDbRoom()
    this.io = props.io
    this.songQueue = []
    this.nowPlaying = null
    this.users = {}
    this.awaitingClients = []
    this.videoState = null
  }

  getDbRoom = async () => {
    this.room = await Room.findByPk(this.id)
    if (!this.room) {
      debug("Room not found. TODO: DO SOMETHING! (catch this in the socket)")
    } else {
      this.room.abandonedAt = null
      this.room.save()
    }
  }

  addUser = (socket) => {
    socket.join(this.id)
    initKaraokeUserSocket(socket, this)
    this.users[socket.id] = socket
    this.sendRoomData(socket)
    if (this.awaitingClients.length > 0) this.awaitingClients.push(socket.id)
    debug("Added user %s. %s total", socket.id, Object.keys(this.users).length)
  }

  /**
   * TODO: remove all songs from queue with singerId === socket.id
   */
  removeUser = async (socket) => {
    teardownKaraokeUserSocket(socket)
    this.updateAwaitingClients(socket)

    // If this was the current user, trash that video
    if (this.nowPlaying && this.nowPlaying.singerId === socket.id) {
      this.stopVideo()
      this.cycleSongs()
    }
    delete this.users[socket.id]
    if (Object.keys(this.users).length === 0) {
      debug("No users left, recording time as abandonedAt on Room")
      this.room.abandonedAt = moment().toISOString()
      this.room.save()
    }
  }

  // Adds song data and singerId to song queue
  // Notifies room
  // Sends success to user
  // Sends room data to room
  addToSongQueue = (videoData, userId) => {
    this.songQueue.push({
      singerId: userId,
      videoData,
    })

    this.songQueueUpdated()

    // Send success feedback to user
    let message
    if (this.songQueue.length === 0) {
      message = `Song added. Get ready to sing!`
    } else {
      const placeInLine = getNumberWithOrdinal(this.songQueue.length)
      message = `Song added. It's ${placeInLine} in line. 🔥`
    }

    this.users[userId].emit("song-added-success", {
      message,
    })
  }

  songQueueUpdated = () => {
    this.notifyRoom(
      `A new song was just added to the queue 👻 (${this.songQueue.length} total)`
    )

    if (this.nowPlaying) {
      this.sendRoomData()
    } else {
      this.cycleSongs()
    }
  }

  songIsPlaying = () => {
    return this.videoState === PLAYER_STATES.PLAYING
  }

  // This method can be called at any time (even to skip current song)
  cycleSongs = (cb) => {
    debug("Cycle Songs...")
    const currentSong = (this.nowPlaying = this.songQueue.shift() || null)

    if (currentSong) {
      debug("Song acquired, preparing ready-check")
      this.videoState = PLAYER_STATES.UNSTARTED
      this.refreshAwaitingClients()
      this.notifyRoom(`Queueing up ${currentSong.videoData.title}`)
      this.sendRoomData()
    } else {
      this.videoState = null
      this.awaitingClients = []
      this.notifyRoom(`Song Queue is empty. Add more!`)
    }
  }

  refreshAwaitingClients = () => {
    this.awaitingClients = Object.keys(this.users)
  }

  removeUserFromAwaiting = (socket) => {
    this.awaitingClients = this.awaitingClients.filter((id) => id !== socket.id)
  }

  updateAwaitingClients = (socket) => {
    debug("AwaitingClients: Removing user %s from awaiting clients", socket.id)
    this.removeUserFromAwaiting(socket)
    // If waiting list is now empty and a song is queued up,
    // set status to PLAYING and notify room
    if (this.awaitingClients.length === 0 && this.nowPlaying) {
      this.notifyRoom(`Now playing: ${this.nowPlaying.videoData.title}`)
      this.playVideo()
    } else {
      if (this.nowPlaying) {
        debug("Still waiting on %s clients", this.awaitingClients.length)
      }
    }
  }

  playVideo = (socket = null) => {
    this.videoState = PLAYER_STATES.PLAYING
    this.#videoControl(PLAYER_STATES.PLAYING, socket)
  }

  stopVideo = (socket = null) => {
    this.nowPlaying = null
    this.videoState = null
    this.#videoControl(PLAYER_STATES.ENDED)
    this.sendRoomData()
  }

  #videoControl = (code, socket = null) => {
    const emitter = socket ? socket : this.io.to(this.id)
    debug("video control emitter: ", typeof emitter)
    debug("Video Control to Room: %s", code)
    emitter.emit("video-control", code)
  }

  notifyRoom = (message) => {
    this.io.to(this.id).emit("notification", {
      message,
    })
  }

  sendRoomData = (socket = null) => {
    const emitter = socket ? socket : this.io.to(this.id)
    emitter.emit("room-data", this.roomData())
  }

  roomData = () => ({
    currentSong: this.nowPlaying,
    currentSinger: this.nowPlaying ? this.nowPlaying.singerId : null,
    upNext: this.songQueue[0],
  })
}

module.exports = {
  KaraokeRoom,
}
