import KaraokeRoom, { KARAOKE_EVENTS } from "../../../server/lib/KaraokeRoom"
import { forEach } from "lodash"

let newRoom
let mockFunction, songAddedCb, nowPlayingCb, emptyQueueCb
beforeEach(() => {
  mockFunction = jest.fn()
  songAddedCb = jest.fn()
  nowPlayingCb = jest.fn()
  emptyQueueCb = jest.fn()
  newRoom = new KaraokeRoom({ id: "abc" })
  newRoom.on(KARAOKE_EVENTS.SONG_ADDED, songAddedCb)
  newRoom.on(KARAOKE_EVENTS.NOW_PLAYING, nowPlayingCb)
  newRoom.on(KARAOKE_EVENTS.EMPTY_QUEUE, emptyQueueCb)
})

// Add two songs to queue
const addSongs = () => {
  newRoom.addToSongQueue({ id: "first-song" }, "user-1")
  newRoom.addToSongQueue({ id: "second-song" }, "user-2")
  newRoom.addToSongQueue({ id: "third-song" }, "user-3")
}

/**
 * Constructor Tests
 */
describe("init", () => {
  it("has a valid constructor", () => {
    new KaraokeRoom({ id: "abc" })
  })

  it("sets the room ID to the given id", () => {
    expect(newRoom.id).toEqual("abc")
  })

  const expectedInitialProperties = {
    songQueue: [],
    nowPlaying: null,
    videoPosition: 0,
    users: [],
  }
  forEach(expectedInitialProperties, (value, key) => {
    it(`initializes ${key} to ${value}`, () => {
      expect(newRoom[key]).toEqual(value)
    })
  })
})

describe("addUser", () => {
  it("requires an instance of socket", () => {
    expect(() => newRoom.addUser("wow")).toThrow(
      "karaokeRoom.addUser requires an instance of Socket"
    )
  })
})

describe('removeUser', () => {
  it.todo('removes a user')
})

/**
 * addToSongQueue
 */
describe("addToSongQueue", () => {
  it("adds song to queue with proper format", () => {
    addSongs()
    const lastSong = newRoom.songQueue.slice(-1).pop()

    expect(lastSong).toEqual({
      singerId: "user-3",
      videoData: { id: "third-song" },
    })
  })

  it("adds songs to queue in FIFO order", () => {
    addSongs()
    const queueIds = newRoom.songQueue.map((s) => s.singerId)
    expect(queueIds).toEqual(["user-1", "user-2", "user-3"])
  })

  it("emits 'song-added' event with message and data", () => {
    newRoom.addToSongQueue({ id: "abc" }, "user")
    expect(songAddedCb).toHaveBeenCalledTimes(1)
    expect(songAddedCb).toHaveBeenCalledWith({
      message: "A new song was just added to the queue 👻 (1 total)",
      data: {
        currentSinger: null,
        currentSong: null,
        position: 0,
        upNext: {
          singerId: "user",
          videoData: { id: "abc" },
        },
      },
    })
  })
})

describe("cycleSong", () => {
  it("calls advanceQueue", () => {
    newRoom.advanceQueue = mockFunction
    newRoom.cycleSong()
    expect(mockFunction).toHaveBeenCalledTimes(1)
  })

  describe("when song queue is empty", () => {
    it("does not call refreshAwaitingClients", () => {
      newRoom.refreshAwaitingClients = mockFunction
      newRoom.cycleSong()
      expect(mockFunction).toHaveBeenCalledTimes(0)
    })

    it("emits a QUEUE_EMPTY event with message and data", () => {
      newRoom.cycleSong()
      expect(emptyQueueCb).toHaveBeenCalledTimes(1)
      expect(emptyQueueCb).toHaveBeenCalledWith({
        message: "Song Queue is empty. Add more!",
        data: newRoom.roomData(),
      })
    })
  })

  describe("when songs are in queue", () => {
    it("calls refreshAwaitingClients if there was a song to advance", () => {
      newRoom.songQueue = [{ videoData: { id: "abc" }, singerId: "user" }]
      newRoom.refreshAwaitingClients = mockFunction
      newRoom.cycleSong()
      expect(mockFunction).toHaveBeenCalledTimes(1)
    })

    it("emits NOW_PLAYING event", () => {
      newRoom.songQueue = [
        { videoData: { id: "abc", title: "Hogwash" }, singerId: "user" },
      ]
      newRoom.cycleSong(mockFunction)
      expect(nowPlayingCb).toHaveBeenCalledWith({
        message: "Now playing: Hogwash",
        data: newRoom.roomData(),
      })
    })
  })
})

/**
 * Up Next: returns top song in queue
 */

/**
 * Advance Queue:
 * - Unshifts song at top of queue, sets to nowPlaying
 *
 */
describe("advanceQueue", () => {
  it("resets videoPosition to 0", () => {
    addSongs()
    newRoom.videoPosition = 342
    newRoom.advanceQueue()
    expect(newRoom.videoPosition).toEqual(0)
  })
})
