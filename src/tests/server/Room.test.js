import Room from "../../../server/lib/Room";
import { forEach } from "lodash";

const newRoom = new Room({ id: "abc" });

/**
 * Constructor Tests
 */
it("has a valid constructor", () => {
  new Room({ id: "abc" });
});

it("sets the room ID to the given id", () => {
  expect(newRoom.id).toEqual("abc");
});

const expectedInitialProperties = {
  songQueue: [],
  nowPlaying: null,
  videoPosition: 0,
  users: [],
};
forEach(expectedInitialProperties, (value, key) => {
  it(`initializes ${key} to ${value}`, () => {
    expect(newRoom[key]).toEqual(value);
  });
});

/**
 * Operations tests
 */

/**
 * Adding song to queue
 * - Added song to end of queue,
 * - Calls callback with self
 */

/**
 * Cycling song
 * - Changes now playing
 *  - Sets position to 0
 *  - Null to <song>
 *  - If end of list, <song> to null
 * - Calls callback with self
 */

/**
 * Up Next: returns top song in queue
 */

/**
 * Advance Queue:
 * - Unshifts song at top of queue, sets to nowPlaying
 *
 */
