/**
 * Room Class:
 * Attributes:
 * * Song Queue <Song[]>
 * * nowPlaying <Song>
 * * videoPosition
 * * users <Socket
 *
 */

export default class Room {
  constructor({ id, io }) {
    this.id = id;
    this.io = io;
    this.songQueue = [];
    this.nowPlaying = null;
    this.videoPosition = 0;
    this.users = [];
    this.awaitingClients = null;
  }

  addToSongQueue = (videoData, userId, cb) => {
    songQueue.push({
      singerId: userId,
      videoData,
    });

    console.log(
      `Song added for room ${roomId}. ${this.songQueue.length} total.`
    );

    cb(this);

    if (!nowPlaying[roomId]) {
      cycleSong();
    }
  };

  roomData = () => ({
    currentSong: this.nowPlaying,
    currentSinger: currentSong ? currentSong.singerId : null,
    upNext: this.songQueue[0],
    position: this.videoPosition,
  });

  songIsPlaying = () => {
    return !!this.nowPlaying;
  };

  getUpNext = () => {
    return getSongQueue()[0];
  };

  // Remove and return song at top of queue
  advanceQueue = () => {
    this.videoPosition = 0;
    this.nowPlaying = this.songQueue.shift();
    return this.nowPlaying;
  };

  refreshAwaitingClients = () => {
    this.awaitingClients = this.users.map((socket) => socket.id);
  };

  cycleSong = () => {
    console.log("Cycling songs");
    const currentSong = advanceQueue();

    if (currentSong) {
      notifyRoom(`Now playing: ${currentSong.videoData.title}`);
      refreshAwaitingClients();
    } else {
      console.log("No more songs");
    }
    broadcastRoomData();
  };
}
