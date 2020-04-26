const util = require("util")
const EventEmitter = require("events").EventEmitter

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
 *
 */
export const KARAOKE_EVENTS = {
  SONG_ADDED: "song-added",
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
  }

  addToSongQueue = (videoData, userId, cb) => {
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

export default KaraokeRoom
