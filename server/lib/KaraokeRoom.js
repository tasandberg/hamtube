const util = require("util")
const EventEmitter = require("events").EventEmitter
const Socket = require("socket.io/lib/socket")
const PLAYER_STATES = require("../lib/playerStates")
const debug = require('debug')('karaoke_room')
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
const KARAOKE_EVENTS = {
  SONG_ADDED: "song-added",
  CLIENTS_READY: "clients-ready",
  NOW_PLAYING: "now-playing",
  EMPTY_QUEUE: "empty-queue",
  COUNTDOWN: "count-down"
}

const COUNTDOWN_LENGTH = 5000

class KaraokeRoom {
  constructor({ id }) {
    this.id = id
    this.songQueue = []
    this.nowPlaying = null
    this.videoPosition = 0
    this.users = []
    this.awaitingClients = []
    this.playerStatus = PLAYER_STATES.UNSTARTED
    this.countdown = null
  }

  addUser = (socket) => {
    if (!(socket instanceof Socket)) {
      throw new Error("karaokeRoom.addUser requires an instance of Socket")
    }
    this.users.push(socket)
    debug('added user %s. (%s total)', socket.id, this.users.length)
  };

  removeUser = (socket) => {
    if (!(socket instanceof Socket)) {
      throw new Error("karaokeRoom.removeUser requires an instance of Socket")
    }
    debug("Removing user %s", socket.id)
    this.updateAwaitingClients(socket)
    this.users = this.users.filter((s) => s.id !== socket.id)
    debug('Removing user %s. (%s total)', socket.id, this.users.length)
  };

  addToSongQueue = (videoData, userId) => {
    this.songQueue.push({
      singerId: userId,
      videoData,
    })

    debug(`A new song was just added to the queue 👻 (${this.songQueue.length} total)`)
    this.#emitMessage(
      KARAOKE_EVENTS.SONG_ADDED,
      `A new song was just added to the queue 👻 (${this.songQueue.length} total)`
    )
  };

  #emitMessage = (eventKey, message) => {
    this.emit(eventKey, {
      message,
      data: this.roomData(),
    })
  };

  roomData = () => ({
    currentSong: this.nowPlaying,
    currentSinger: this.nowPlaying ? this.nowPlaying.singerId : null,
    upNext: this.songQueue[0],
    videoPosition: this.videoPosition,
  });

  isSongPlaying = () => {
    return this.playerStatus === PLAYER_STATES.PLAYING
  };

  // Remove and return song at top of queue
  advanceQueue = () => {
    debug('Advancing queue...')
    this.videoPosition = 0
    this.nowPlaying = this.songQueue.shift()
    debug('Now Playing: %s', this.nowPlaying.videoData.title)
    return this.nowPlaying
  };

  refreshAwaitingClients = () => {
    debug("Refreshing awaiting clients")
    this.playerStatus = PLAYER_STATES.UNSTARTED
    this.awaitingClients = this.users.map((socket) => socket.id)
  };

  updateAwaitingClients = (socket) => {
    this.awaitingClients = this.awaitingClients.filter(s => s.id !== socket.id)
    debug("Removing user from awaitingClients (%s). %s left.", socket.id, this.awaitingClients.length)

    if (this.playerStatus !== PLAYER_STATES.PLAYING) {
      // If waiting list is now empty, set status to PLAYING and emit CLIENTS_READY
      if (this.awaitingClients.length === 0) {
        debug("All clients loaded, setting playing")
        this.playerStatus = PLAYER_STATES.PLAYING
        this.#emitMessage(KARAOKE_EVENTS.CLIENTS_READY, "Get ready to sing!")
      }
    }
  };

  cycleSong = () => {
    const currentSong = this.advanceQueue()

    if (currentSong) {
      this.playerStatus = PLAYER_STATES.UNSTARTED
      this.videoPosition = 0
      this.refreshAwaitingClients()
      debug('Cycle Song emitting Now Playing')
      this.#emitMessage(
        KARAOKE_EVENTS.NOW_PLAYING,
        `Now playing: ${currentSong.videoData.title}`
      )
    } else {
      debug('Queue Empty')
      this.#emitMessage(
        KARAOKE_EVENTS.EMPTY_QUEUE,
        `Song Queue is empty. Add more!`
      )
      return false
    }
  };

  endSong = () => {
    debug("Ending song %s", this.nowPlaying.videoData.title)
    this.playerStatus = PLAYER_STATES.ENDED
    this.cycleSong()
  }
}

util.inherits(KaraokeRoom, EventEmitter)

module.exports = {
  KaraokeRoom,
  KARAOKE_EVENTS,
}
