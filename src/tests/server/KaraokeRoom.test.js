import { KaraokeRoom } from "../../../server/lib/KaraokeRoom"
import { forEach } from "lodash"

let io = jest.fn()

let newRoom
function dummySocket(id) {
  return {
    id: id,
    emit: jest.fn(),
    join: jest.fn(),
    on: jest.fn(),
  }
}
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
    videoPosition: 0,
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
    socket = dummySocket("asdf")
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

    it("adds event listeners", () => {
      expect(socket.on).toHaveBeenCalledTimes(4)
    })
  })
})
