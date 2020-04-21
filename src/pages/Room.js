import React from "react"
import io from "socket.io-client"
import initializePeer from "../util/peer"
import _ from "lodash"
import RoomLayout from "../components/RoomLayout"
import SongList from "../components/SongInput"
import NotificationBar from "../components/NotificationBar"

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
      songInputNotification: "",
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
    })
  }

  startLocalVideo() {
    console.log("Requesting local video")
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        console.log("Local Video Obtained")
        const userVideoEl = document.getElementById("local-video")
        console.log(userVideoEl)
        console.log(stream)

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

  addSong = (data) => {
    this.socket.emit("add-song", data)
  }

  toggleMute = (id) => {
    const el = this.peerVids[id]
    el.muted = !el.muted
  }

  render = () => {
    return (
      <RoomLayout
        stopVideo={this.stopStream}
        startVideo={this.shareStream}
        peers={Object.values(this.state.peers)}
      >
        {/* These Children will render inside of the Youtube Box, upper left */}
        <SongList
          isActive={this.state.songListOpen}
          activate={this.openSongList}
          close={this.closeSongList}
          addSong={this.addSong}
          songInputNotification={this.state.songInputNotification}
        />
        <NotificationBar notification={this.state.notification} />
      </RoomLayout>
    )
  }
}
