import { inherits } from "util"
import EventEmitter from "events"
import { KaraokeRoom } from "../../server/lib/KaraokeRoom"
import { forEach } from "lodash"
const PLAYER_STATES = require("../../server/lib/playerStates")

let io = {
  to: jest.fn(() => ({ emit: jest.fn() })),
  emit: jest.fn(),
}

let newRoom

// Dummy Socket
class Socket {
  constructor(id) {
    this.id = id
    this.join = jest.fn()
  }
}

inherits(Socket, EventEmitter)

beforeEach(() => {
  newRoom = new KaraokeRoom({ id: "abc", io: io })
})
/**
 * Constructor Tests
 */
describe("init", () => {
  it("has a valid constructor", () => {
    new KaraokeRoom({ id: "abc", io: io })
  })

  it("sets the room ID to the given id", () => {
    expect(newRoom.id).toEqual("abc")
  })

  it("requires id prop", () => {
    expect(() => new KaraokeRoom("abc")).toThrow("KaraokeRoom requires id")
  })

  const expectedInitialProperties = {
    songQueue: [],
    nowPlaying: null,
    videoState: null,
    users: {},
  }
  forEach(expectedInitialProperties, (value, key) => {
    it(`initializes ${key} to ${value}`, () => {
      expect(newRoom[key]).toEqual(value)
    })
  })
})

describe("user events", () => {
  let socket
  beforeEach(() => {
    socket = new Socket("asdf")
    newRoom.addUser(socket)
  })
  describe("user connection", () => {
    it("adds user to its user list", () => {
      expect(newRoom.users[socket.id]).toEqual(socket)
      expect(Object.keys(newRoom.users).length).toEqual(1)
    })

    it("joins user to the room", () => {
      expect(socket.join).toHaveBeenCalledWith(newRoom.id)
    })

    const expectedListeners = [
      "player-ready",
      "video-position",
      "song-ended",
      "add-song",
      "disconnect",
    ]
    expectedListeners.forEach((event) => {
      it(`adds ${event} listener`, () => {
        expect(socket.listenerCount(event)).toEqual(1)
      })
    })

    it("sends room data to the user", () => {
      const dataCb = jest.fn()
      const otherUser = new Socket("user2")
      otherUser.on("room-data", dataCb)
      newRoom.addUser(otherUser)
      expect(dataCb).toHaveBeenCalledWith(newRoom.roomData())
    })

    describe("when theres an awaitingClients check in-flight", () => {
      it("adds user to awaiting clients list", () => {
        const otherUser = new Socket("user2")
        newRoom.awaitingClients = [1, 2, 3]
        newRoom.addUser(otherUser)
        expect(newRoom.awaitingClients).toEqual([1, 2, 3, "user2"])
      })
    })
  })

  describe("user disconnect", () => {
    it("removes user from user list and awaitingClients", () => {
      newRoom.addUser(new Socket("socket-2"))
      newRoom.addUser(new Socket("socket-3"))
      newRoom.refreshAwaitingClients()
      expect(Object.keys(newRoom.users).length).toEqual(3)
      expect(newRoom.awaitingClients.length).toEqual(3)
      newRoom.removeUser(socket)
      expect(newRoom.awaitingClients).not.toContain(socket.id)
      expect(Object.keys(newRoom.users).length).not.toContain(socket.id)
    })

    it("can be called more than once harmlessly", () => {
      newRoom.addUser(new Socket("socket-2"))
      newRoom.addUser(new Socket("socket-3"))
      newRoom.removeUser(socket)
      newRoom.removeUser(socket)
      expect(Object.keys(newRoom.users)).toEqual(["socket-2", "socket-3"])
    })
  })

  describe("user add-song", () => {
    describe("when queue is empty", () => {
      it("moves song to nowPlaying if queue is empty", () => {
        socket.emit("add-song", { title: "wakka wakka" })
        expect(newRoom.nowPlaying).toEqual({
          videoData: { title: "wakka wakka" },
          singerId: socket.id,
        })
      })

      // This really belongs in the cycle song test
      it("refreshes awaitingClientList", () => {
        socket.emit("add-song", { title: "wakka wakka" })
        expect(newRoom.awaitingClients).toEqual([socket.id])
      })

      it("sends success message to user", () => {
        const cb = jest.fn()
        socket.on("song-added-success", cb)
        socket.emit("add-song", { title: "wakka wakka" })
        expect(cb).toHaveBeenCalledWith({
          message: "Song added. Get ready to sing!",
        })
      })
    })
    describe("when queue is not empty", () => {
      beforeEach(() => {
        socket.emit("add-song", { title: "wakka wakka" })
      })
      it("adds song to queue", () => {
        socket.emit("add-song", { title: "Second Fiddle" })
        expect(newRoom.songQueue).toEqual([
          {
            videoData: { title: "Second Fiddle" },
            singerId: socket.id,
          },
        ])
      })
      it("sends success message to user", () => {
        const cb = jest.fn()
        socket.on("song-added-success", cb)
        socket.emit("add-song", { title: "wakka wakka" })
        expect(cb).toHaveBeenCalledWith({
          message: "Song added. It's 1st in line. 🔥",
        })
      })

      it("does not send success message to other users", () => {
        const cb1 = jest.fn()
        const cb2 = jest.fn()
        const otherUser = new Socket("socket-2")
        newRoom.addUser(otherUser)
        socket.on("song-added-success", cb1)
        otherUser.on("song-added-success", cb2)
        socket.emit("add-song", { title: "wakka wakka" })
        expect(cb1).toHaveBeenCalled()
        expect(cb2).not.toHaveBeenCalled()
      })
    })
  })

  describe("user player-ready", () => {
    let otherUser
    beforeEach(() => {
      otherUser = new Socket("socket-2")
      newRoom.addUser(otherUser)
      socket.emit("add-song", { title: "first song" })
      otherUser.emit("add-song", { title: "second song" })
    })
    describe("when one song is nowPlaying and another in the queue", () => {
      it("has both users in awaitingClients", () => {
        expect(newRoom.videoState).toEqual(PLAYER_STATES.UNSTARTED)
        expect(newRoom.awaitingClients).toEqual([socket.id, otherUser.id])
      })

      it("removes emitting user from awaitingClients", () => {
        otherUser.emit("player-ready")
        expect(newRoom.awaitingClients).toEqual([socket.id])
      })

      it("plays video when all users emit player-ready", () => {
        socket.emit("player-ready")
        otherUser.emit("player-ready")
        expect(newRoom.videoState).toBe(PLAYER_STATES.PLAYING)
      })
    })

    describe("when user emits player-ready and song is already playing", () => {
      beforeEach(() => {
        socket.emit("player-ready")
        otherUser.emit("player-ready")
      })
      it("tells the user to play the video immediately", () => {
        const newComer = new Socket("socket-3")
        const videoCb = jest.fn()
        newComer.on("video-control", videoCb)
        newRoom.addUser(newComer)
        newComer.emit("player-ready")
        expect(videoCb).toHaveBeenCalledWith(PLAYER_STATES.PLAYING)
      })
    })
  })

  describe("user song-ended", () => {
    let otherUser

    beforeEach(() => {
      otherUser = new Socket("socket-2")
      newRoom.addUser(otherUser)
      socket.emit("add-song", { title: "first song" })
      otherUser.emit("add-song", { title: "second song" })
      socket.emit("player-ready")
      otherUser.emit("player-ready")
    })

    it("does nothing when user is not current singer", () => {
      otherUser.emit("song-ended")
      expect(newRoom.nowPlaying.videoData.title).toEqual("first song")
      expect(newRoom.videoState).toEqual(PLAYER_STATES.PLAYING)
    })

    it("cycles song if user us current singer", () => {
      socket.emit("song-ended")
      expect(newRoom.nowPlaying.videoData.title).toEqual("second song")
      expect(newRoom.videoState).toEqual(PLAYER_STATES.UNSTARTED)
    })

    it("leaves player in empty state if no songs are left", () => {
      socket.emit("song-ended")
      otherUser.emit("song-ended")
      expect(newRoom.videoState).toBe(null)
      expect(newRoom.nowPlaying).toEqual(null)
    })
  })
})

describe("cycling songs", () => {
  let otherUser, notificationCb, socket

  beforeEach(() => {
    socket = new Socket("asdf")
    newRoom.addUser(socket)
    notificationCb = jest.fn()
    otherUser = new Socket("socket-2")
    otherUser.on("notification", notificationCb)
    socket.on("notification", notificationCb)
  })

  describe("when songs are in queue", () => {
    describe("when no song is playing", () => {
      beforeEach(() => {
        newRoom.songQueue = [
          {
            videoData: { title: "Hog of the Forsaken" },
            singerId: socket.id,
          },
        ]
      })

      it("advances song to nowPlaying", () => {
        newRoom.cycleSongs()
        expect(newRoom.nowPlaying).toEqual({
          videoData: { title: "Hog of the Forsaken" },
          singerId: socket.id,
        })
      })

      it("takes song from top of the queue", () => {
        newRoom.cycleSongs()
        expect(newRoom.songQueue).toEqual([])
      })

      it("sends a notification to the room", () => {
        const notifyStub = jest.fn()
        newRoom.notifyRoom = notifyStub
        newRoom.cycleSongs()
        expect(notifyStub).toHaveBeenCalledWith(
          `Queueing up ${newRoom.nowPlaying.videoData.title}`
        )
      })
    })
  })

  describe("when queue is empty", () => {
    it("sends a notification to the room", () => {
      const notifyStub = jest.fn()
      newRoom.notifyRoom = notifyStub
      newRoom.cycleSongs()
      expect(notifyStub).toHaveBeenCalledWith(`Song Queue is empty. Add more!`)
    })

    it("sets awaitingClients to empty array", () => {
      newRoom.awaitingClients = [1, 2, 3, 4]
      newRoom.cycleSongs()
      expect(newRoom.awaitingClients).toHaveLength(0)
    })

    it("sets playerStatus to null", () => {
      newRoom.videoState = 5
      newRoom.cycleSongs()
      expect(newRoom.videoState).toBe(null)
    })
  })
})

describe("big mamma jamma integration test", () => {
  let user1, user2, user3, user4

  beforeEach(() => {
    user1 = new Socket("1")
    user2 = new Socket("2")
    user3 = new Socket("3")
    user4 = new Socket("4")

    newRoom.addUser(user1)
    newRoom.addUser(user2)
    newRoom.addUser(user3)
  })

  describe("song added, 2/3 users are ready", () => {
    it("is still waiting on one user", () => {
      user1.emit("add-song", { title: "Donks" })
      expect(newRoom.awaitingClients).toHaveLength(3)
      user1.emit("player-ready")
      user3.emit("player-ready")
      expect(newRoom.awaitingClients).toEqual([user2.id])
    })

    it("adds a newcomer to awaitingClients midway through check", () => {
      user1.emit("add-song", { title: "Donks" })
      user1.emit("player-ready")
      user3.emit("player-ready")
      newRoom.addUser(user4)
      expect(newRoom.awaitingClients).toEqual([user2.id, user4.id])
    })
  })

  describe("multiple song cycles", () => {
    it("shows expected states throughout", () => {
      user1.emit("add-song", {
        title: "Donks",
      })
      user1.emit("add-song", {
        title: "Donks 2",
      })
      user3.emit("add-song", {
        title: "Forever young",
      })
      user2.emit("player-ready")
      user1.emit("player-ready")
      user2.emit("add-song", {
        title: "Keep on rockin",
      })
      user3.emit("player-ready")
      expect(newRoom.videoState).toBe(PLAYER_STATES.PLAYING)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Donks")
      user1.emit("song-ended")
      expect(newRoom.videoState).toBe(PLAYER_STATES.UNSTARTED)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Donks 2")
      user1.emit("player-ready")
      newRoom.addUser(user4)
      user2.emit("player-ready")
      user3.emit("player-ready")
      user4.emit("player-ready")
      expect(newRoom.videoState).toBe(PLAYER_STATES.PLAYING)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Donks 2")

      user1.emit("song-ended")
      user4.emit("add-song", {
        title: "Master of Puppets",
      })
      user4.emit("player-ready")
      user3.emit("player-ready")
      expect(newRoom.videoState).toBe(PLAYER_STATES.UNSTARTED)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Forever young")

      user2.emit("player-ready")
      user1.emit("player-ready")
      expect(newRoom.videoState).toBe(PLAYER_STATES.PLAYING)

      user1.emit("song-ended") // Non-Singer, nothing should happen
      expect(newRoom.videoState).toBe(PLAYER_STATES.PLAYING)

      expect(newRoom.nowPlaying.videoData.title).toEqual("Forever young")
      user3.emit("song-ended")
      expect(newRoom.videoState).toBe(PLAYER_STATES.UNSTARTED)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Keep on rockin")

      // Test disconnect during ready-check
      user2.emit("player-ready")
      user4.emit("player-ready")
      user1.emit("player-ready")
      user3.emit("disconnect")
      expect(newRoom.videoState).toBe(PLAYER_STATES.PLAYING)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Keep on rockin")

      // Test disconnect in mid-song
      user2.emit("disconnect")
      expect(newRoom.videoState).toBe(PLAYER_STATES.UNSTARTED)
      expect(newRoom.nowPlaying.videoData.title).toEqual("Master of Puppets")
      user4.emit("disconnect")

      expect(newRoom.videoState).toBe(null)
      expect(newRoom.users).toEqual({ [user1.id]: user1 })
      expect(newRoom.awaitingClients).toHaveLength(0)
      expect(newRoom.nowPlaying).toBe(null)
      expect(newRoom.songQueue).toHaveLength(0)
    })
  })
})
