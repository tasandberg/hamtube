import Room from "../../../server/lib/Room"
import { forEach } from "lodash"

const newRoom = new Room({ id: "abc" })

/**
 * Constructor Tests
 */
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

/**
 * Operations tests
 */
