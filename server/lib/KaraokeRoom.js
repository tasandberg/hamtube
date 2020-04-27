const util = require("util")
const EventEmitter = require("events").EventEmitter
const Socket = require("socket.io/lib/socket")
const PLAYER_STATES = require("../lib/playerStates")
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
export const KARAOKE_EVENTS = {
  SONG_ADDED: "song-added",
  CLIENTS_READY: "clients-ready",
  NOW_PLAYING: "now-playing",
  EMPTY_QUEUE: "empty-queue",
}

class KaraokeRoom {
  constructor({ id }) {
    this.id = id
    this.songQueue = []
    this.nowPlaying = null
    this.videoPosition = 0
    this.users = []
    this.awaitingClients = null
    this.playerStatus = PLAYER_STATES.UNSTARTED
  }

  addUser = (socket) => {
    if (!(socket instanceof Socket)) {
      throw new Error("karaokeRoom.addUser requires an instance of Socket")
    }
    this.users.push(socket)
  }

  removeUser = (socket) => {
    if (!(socket instanceof Socket)) {
      throw new Error("karaokeRoom.removeUser requires an instance of Socket")
    }
    this.users = this.users.filter((s) => s.id !== socket.id)
  }

  addToSongQueue = (videoData, userId) => {
    this.songQueue.push({
      singerId: userId,
      videoData,
    })

    this.#emitMessage(
      KARAOKE_EVENTS.SONG_ADDED,
      `A new song was just added to the queue 👻 (${this.songQueue.length} total)`
    )
  }

  #emitMessage = (eventKey, message) => {
    this.emit(eventKey, {
      message,
      data: this.roomData(),
    })
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
    this.playerStatus = PLAYER_STATES.UNSTARTED
    this.awaitingClients = this.users.map((socket) => socket.id)
  }

  updateAwaitingClients = (socket) => {
    // If user is ready but clients are still loading video
    if (this.playerStatus === PLAYER_STATES.UNSTARTED) {
      this.awaitingClients = this.awaitingClients.filter(
        (id) => id !== socket.id
      )

      // If waiting list is now empty, set status to PLAYING and emit CLIENTS_READY
      if (this.awaitingClients.length === 0) {
        this.playerStatus = PLAYER_STATES.PLAYING
        this.#emitMessage(KARAOKE_EVENTS.CLIENTS_READY, "Get ready to sing!")
      }
    }
  }

  cycleSong = (cb) => {
    const currentSong = this.advanceQueue()

    if (currentSong) {
      this.refreshAwaitingClients()
      this.#emitMessage(
        KARAOKE_EVENTS.NOW_PLAYING,
        `Now playing: ${currentSong.videoData.title}`
      )
    } else {
      this.#emitMessage(
        KARAOKE_EVENTS.EMPTY_QUEUE,
        `Song Queue is empty. Add more!`
      )
      return false
    }
  }
}

util.inherits(KaraokeRoom, EventEmitter)

module.exports = {
  KaraokeRoom,
  CLIENT_STATUS,
  KARAOKE_EVENTS,
}
