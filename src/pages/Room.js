import React from "react"
import io from "socket.io-client"
import initializePeer from "../util/peer"
import _ from "lodash"
import RoomLayout from "../components/RoomLayout"
import KaraokeControls from "../components/KaraokeControls"
import SongList from "../components/SongInput"

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
    this.peerVids = {}
    this.peerStream = null
    this.state = {
      name: undefined,
      peers: {},
      videoEnabled: true,
      songListOpen: false,
    }
  }

  componentDidMount() {
    console.log("Initializing client")

    const socket = io("/", { query: `room=${this.roomId}` })
    this.socket = socket

    // this.startLocalVideo()

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

      socket.on("destroy", (id) => {
        this.setState((prevState) => {
          const peers = prevState.peers
          delete peers[id]
          return {
            peers: peers,
          }
        })
      })
    })
  }

  startLocalVideo() {
    console.log("Requesting local video")
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        console.log("Local Video Obtained")
        const userVideoEl = document.getElementById("local-video")
        userVideoEl.srcObject = stream
        this.localVideo = stream

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

  toggleMute = (id) => {
    const el = this.peerVids[id]
    el.muted = !el.muted
  }

  render = () => {
    return (
      <RoomLayout
        userStream={this.localVideo}
        stopVideo={this.stopStream}
        startVideo={this.shareStream}
        videoEnabled={this.state.videoEnabled}
        peers={Object.values(this.state.peers)}
      >
        {/* These Children will render inside of the Youtube Box, upper left */}
        <SongList
          isActive={this.state.songListOpen}
          activate={this.openSongList}
          close={this.closeSongList}
        />
      </RoomLayout>
    )
  }
}
