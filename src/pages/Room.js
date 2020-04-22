import React from "react"
import io from "socket.io-client"
import initializePeer from "../util/peer"
import _ from "lodash"
import RoomLayout from "../components/RoomLayout"
import SongList from "../components/SongInput"
import NotificationBar from "../components/NotificationBar"
import VideoPlayer from "../components/VideoPlayer"

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
      currentSong: null,
      upNext: null,
      videoStreams: {},
      videoState: null,
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isEmpty, isEqual } = _
    // Check if videoStreams
    if (!isEmpty(this.state.videoStreams)) {
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

  componentDidMount() {
    console.log("Initializing client")

    const socket = io("/", { query: `room=${this.roomId}` })
    this.socket = socket

    this.startLocalVideo()

    socket.on("connect", () => {
      console.log("Connected to signalling server, Peer ID: %s", socket.id)

      /* On connect, we will send and receive data from all connected peers */
      socket.on("peer", (data) => {
        const peerId = data.peerId
        const peer = initializePeer(this, socket, data)
        console.log("Peer added", peerId)

        this.setState((prevState) => ({
          peers: {
            ...prevState.peers,
            [peerId]: {
              id: peerId,
              peer: peer,
              name: "",
              muted: false,
              volume: 1,
            },
          },
        }))
      })

      socket.on("room-data", (data) => {
        this.setState({
          currentSong: data.nowPlaying,
        })
      })

      socket.on("destroy", (id) => {
        this.setState((prevState) => {
          const { peers, videoStreams } = prevState
          delete peers[id]
          delete videoStreams[id]
          return {
            peers,
            videoStreams,
          }
        })
      })

      socket.on("notification", (data) => {
        this.setState({ notification: null })
        this.setState({ notification: data.message })

        setTimeout(() => {
          if (this.state.notification === data.message) {
            this.setState({ notification: null })
          }
        }, 5000)
      })

      socket.on("song-added-success", (data) => {
        this.setState({
          songInputNotification: data.message,
        })

        setTimeout(() => {
          this.setState({
            songInputNotification: null,
          })
        }, 3000)
      })

      socket.on("new-song", ({ currentSong, currentSinger, upNext }) => {
        console.log(arguments, "new-song")

        this.setState({
          currentSong,
          currentSinger,
          upNext,
        })
      })
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
    console.log("Requesting local video")
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        console.log("Local Video Obtained")
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
      .catch((e) => console.log(e))
  }

  setName = () => {
    this.socket.emit("set-name", this.nameBox.value)
    this.setState({
      name: this.nameBox.value,
    })
  }

  shareStream = () => {
    console.log("Sharing local video stream")

    this.setState({
      videoEnabled: true,
    })

    Object.keys(this.state.peers).forEach((id) => {
      const { peer } = this.state.peers[id]
      console.log(peer.streams)
      peer.addStream(this.peerStream)
    })
  }

  stopStream = () => {
    console.log("Disconnecting local video from peers")

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
    this.socket.emit("video-position", position)
  }

  addSong = (data) => {
    this.socket.emit("add-song", data)
  }

  broadcastVideoData = (videoCode) => {
    this.socket.emit("video-sync", videoCode)

    _.each(this.state.peers, (p, id) => {
      const message = { TYPE: "video-sync", data: videoCode }
      p.peer.send(JSON.stringify(message))
    })
  }

  render = () => {
    const {
      currentSong,
      notification,
      songInputNotification,
      songListOpen,
      upNext,
      videoState,
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
          broadcast={this.broadcastVideoData}
          videoState={videoState}
          isLocalUser={singer && singer.id === "local"}
          setCurrentTime={this.setCurrentTime}
          resource={currentSong}
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
