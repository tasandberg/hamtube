import Room from "../../../server/lib/Room"
import { forEach } from "lodash"

let newRoom
beforeEach(() => {
  newRoom = new Room({ id: "abc" })
})

/**
 * Constructor Tests
 */
describe("init", () => {
  it("has a valid constructor", () => {
    new Room({ id: "abc" })
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

describe("addToSongQueue", () => {
  const callback = jest.fn()

  // Add two songs to queue
  const addSongs = () => {
    newRoom.addToSongQueue({ id: "first-song" }, "user-1", callback)
    newRoom.addToSongQueue({ id: "second-song" }, "user-2", callback)
    newRoom.addToSongQueue({ id: "third-song" }, "user-3", callback)
  }

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

  it("passes the room data to the callback", () => {
    const callback = jest.fn()
    newRoom.addToSongQueue({ id: "abc" }, "user", callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(newRoom.roomData())
  })
})

/**
 * Cycling song
 * - Changes now playing
 *  - Sets position to 0
 *  - Null to <song>
 *  - If end of list, <song> to null
 * - Calls callback with self
 */
describe("cycleSong", () => {
  it("calls advanceQueue", () => {
    const advanceQueueMock = jest.fn()
    newRoom.advanceQueue = advanceQueueMock
    newRoom.cycleSong()
    expect(advanceQueueMock).toHaveBeenCalledTimes(1)
  })

  describe("when songs are in queue", () => {
    it("returns true", () => {
      newRoom.songQueue = [{ videoData: { id: "abc" }, singerId: "user" }]
      expect(newRoom.cycleSong()).toEqual(true)
    })

    it("calls refreshAwaitingClients if there was a song to advance", () => {
      newRoom.songQueue = [{ videoData: { id: "abc" }, singerId: "user" }]
      const refreshAwaitingClientsMock = jest.fn()
      newRoom.refreshAwaitingClients = refreshAwaitingClientsMock
      newRoom.cycleSong()
      expect(refreshAwaitingClientsMock).toHaveBeenCalledTimes(1)
    })

    it("passes success message to callback", () => {
      newRoom.songQueue = [
        { videoData: { id: "abc", title: "Hogwash" }, singerId: "user" },
      ]
      const callback = jest.fn()
      newRoom.cycleSong(callback)
      expect(callback).toHaveBeenCalledWith({
        message: "Now playing: Hogwash",
        roomData: newRoom.roomData(),
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
