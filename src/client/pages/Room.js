import React from "react"
import _ from "lodash"
import RoomLayout from "../components/RoomLayout"
import SongList from "../components/SongInput"
import NotificationBar from "../components/NotificationBar"
import VideoPlayer from "../components/VideoPlayer"
import attachClientSocket from "../util/attachClientSocket"
const debug = require("debug")("Hamtube:Room")

const vidOptions = {
  video: {
    facingMode: "user",
    width: { min: 160, ideal: 400, max: 1280 },
    height: { min: 120, ideal: 400, max: 720 },
    aspectRation: { ideal: 1 },
  },
  audio: true,
}

export default class Room extends React.Component {
  constructor(props) {
    super(props)

    this.roomId = props.match.params.roomId
    this.videoStreams = {}
    this.peerStream = null
    this.state = {
      name: undefined,
      peers: {},
      videoEnabled: true,
      songListOpen: false,
      songInputNotification: "",
      currentSinger: null,
      currentSong: {},
      videoPosition: 0,
      upNext: null,
      videoStreams: {},
      videoState: null,
    }
  }

  componentDidMount() {
    debug("Initializing client")
    attachClientSocket(this)

    this.startLocalVideo()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isEmpty, isEqual } = _
    // Check if videoStreams is populated
    if (!isEmpty(this.state.videoStreams)) {
      // If videoStreams or currentSong changed, reattach videos
      if (
        !isEqual(prevState.videoStreams, this.state.videoStreams) ||
        !isEqual(prevState.currentSong, this.state.currentSong)
      ) {
        this.reattachVideos()
      }
    }
  }

  reattachVideos() {
    _.each(this.state.videoStreams, (stream, id) => {
      const el = document.getElementById(`${id}-video`)
      if (el) el.srcObject = stream
    })
  }

  // Build a peer-like object to pass along with peers to layout
  buildLocalPeer() {
    return {
      id: "local",
      muted: true,
      volume: 0,
    }
  }

  getCurrentSinger() {
    const { currentSinger } = this.state
    if (!currentSinger) return
    if (currentSinger === this.socket.id) {
      return this.buildLocalPeer()
    } else {
      return this.state.peers[currentSinger]
    }
  }

  startLocalVideo() {
    debug("Requesting local video")
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        debug("Local Video Obtained")
        this.localVideo = stream
        this.setState((prevState) => ({
          videoStreams: {
            ...prevState.videoStreams,
            local: stream,
          },
        }))

        // Clone stream for sending to peers
        this.peerStream = this.localVideo.clone()
      })
      .catch((e) => debug(e))
  }

  setName = () => {
    this.socket.emit("set-name", this.nameBox.value)
    this.setState({
      name: this.nameBox.value,
    })
  }

  shareStream = () => {
    debug("Sharing local video stream")

    this.setState({
      videoEnabled: true,
    })

    Object.keys(this.state.peers).forEach((id) => {
      const { peer } = this.state.peers[id]
      debug(peer.streams)
      peer.addStream(this.peerStream)
    })
  }

  stopStream = () => {
    debug("Disconnecting local video from peers")

    this.setState({
      videoEnabled: false,
    })

    // Disable the tracks of the stream
    this.peerStream.getTracks().forEach((t) => {
      t.enabled = false
    })

    // Tell peers to update their remote video streams
    this.socket.emit("disconnect-video")

    // Remove streams from peers
    _.forEach(this.state.peers, ({ id, peer }) => {
      peer.removeStream(this.peerStream)
    })

    // Send current peerStream to the collectors
    this.peerStream = null
  }

  openSongList = () => {
    this.setState({ songListOpen: true })
  }

  closeSongList = () => {
    this.setState({ songListOpen: false })
  }

  setCurrentTime = (position) => {
    this.socket.emit("video-position", { position, timeRecorded: Date.now() })
  }

  addSong = (data) => {
    this.socket.emit("add-song", data)
  }

  onEnd = () => {
    this.socket.emit("song-ended")
  }

  render = () => {
    const {
      currentSong,
      notification,
      songInputNotification,
      songListOpen,
      upNext,
      videoState,
      videoPosition,
    } = this.state

    const singer = this.getCurrentSinger()
    let peers = Object.values(this.state.peers).concat([this.buildLocalPeer()])

    peers = singer ? _.filter(peers, (p) => p.id !== singer.id) : peers

    return (
      <RoomLayout
        stopVideo={this.stopStream}
        startVideo={this.shareStream}
        peers={peers}
        currentSinger={singer}
      >
        {/* These Children will render inside of the Youtube Box, upper left */}
        <VideoPlayer
          videoState={videoState}
          isLocalUser={singer && singer.id === "local"}
          setCurrentTime={this.setCurrentTime}
          videoData={currentSong && currentSong["videoData"]}
          videoPosition={videoPosition}
          onEnd={this.onEnd}
          broadcastReady={() => this.socket.emit("player-ready")}
        />
        <SongList
          isActive={songListOpen}
          activate={this.openSongList}
          close={this.closeSongList}
          addSong={this.addSong}
          songInputNotification={songInputNotification}
        />
        <NotificationBar upNext={upNext} notification={notification} />
      </RoomLayout>
    )
  }
}
