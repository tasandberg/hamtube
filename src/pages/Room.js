import React from "react"
import io from "socket.io-client"
import initializePeer from "../util/peer"
import _ from "lodash"
import RoomLayout from "../components/RoomLayout"

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
    this.state = {
      name: undefined,
      peers: {},
      videoEnabled: true,
    }
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
    console.log(navigator.mediaDevices.getSupportedConstraints())
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        console.log("Local Video Obtained")
        const userVideoEl = document.getElementById("local-video")
        userVideoEl.srcObject = stream
        this.localVideo = stream

        if (this.state.videoEnabled) this.shareStream()
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

    this.peerStream = this.localVideo.clone()

    Object.keys(this.state.peers).forEach((id) => {
      const { peer } = this.state.peers[id]
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

  toggleMute = (id) => {
    const el = this.peerVids[id]
    el.muted = !el.muted
  }

  render = () => {
    console.log(this.state.videoEnabled, "videnabled")

    return (
      <RoomLayout
        userStream={this.localVideo}
        stopVideo={this.stopStream}
        startVideo={this.shareStream}
        videoEnabled={this.state.videoEnabled}
        peers={Object.values(this.state.peers)}
      />
    )
  }
}
