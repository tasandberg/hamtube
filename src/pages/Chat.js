import React from "react"
import io from "socket.io-client"
import initializePeer from "../util/peer"
import _ from "lodash"

const vidOptions = {
  video: {
    facingMode: "user",
    width: { min: 160, ideal: 640, max: 1280 },
    height: { min: 120, ideal: 360, max: 720 },
  },
  audio: true,
}

export default class Chat extends React.Component {
  constructor(props) {
    super(props)

    this.peerVids = {}
    this.state = {
      name: undefined,
      peers: {},
      sharing: false,
    }
  }

  componentDidMount() {
    console.log("Initializing client")
    const socket = io("/")
    this.socket = socket

    this.startLocalVideo()

    socket.on("connect", () => {
      console.log("Connected to signalling server, Peer ID: %s", socket.id)

      /* On connect, we will send and receive data from all connected peers */
      socket.on("peer", (data) => {
        const peerId = data.peerId
        const peer = initializePeer(this, socket, data)

        this.setState((prevState) => ({
          peers: { ...prevState.peers, [peerId]: { peer: peer, name: "" } },
        }))
      })
    })
  }

  componentWillUnmount() {
    console.log("unmounting")
    this.socket.disconnect()
  }

  startLocalVideo() {
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        this.localVideo.srcObject = stream
        this.stream = stream
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
    this.setState({
      sharing: true,
    })

    this.peerStream = this.stream.clone()

    Object.keys(this.state.peers).forEach((id) => {
      const { peer } = this.state.peers[id]
      peer.addStream(this.peerStream)
    })
  }

  stopStream = () => {
    this.setState({
      sharing: false,
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

  render = () => (
    <section className="section">
      <div className="container">
        <h1 className="title">Video Chat</h1>
        {this.state.name ? (
          <h3>{this.state.name}</h3>
        ) : (
          <div>
            <input
              className="input"
              type="text"
              placeholder="Set name for chat"
              ref={(nameBox) => (this.nameBox = nameBox)}
            />
            <button onClick={this.setName}>Set Name</button>
          </div>
        )}
      </div>
      <div className="columns">
        <div className="column is-three-fifths">
          <section className="section has-background-primary">
            <h2 className="title">Main Video</h2>
            <video
              autoPlay
              muted
              id="localVideo"
              ref={(video) => (this.localVideo = video)}
            />
          </section>
        </div>
        <div className="column">
          <section className="section has-background-light">
            <h2>Chat buddies</h2>
            <ul style={{ listStyle: "none" }}>
              {Object.keys(this.state.peers).map((p) => (
                <li key={`peer-${p}`} style={{ listStyle: "none" }}>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <button
        onClick={() =>
          this.state.sharing ? this.stopStream() : this.shareStream()
        }
      >
        {this.state.sharing ? "Stop Sharing" : "Share Video"}
      </button>{" "}
      {this.state.sharing ? (
        <span className="has-text-success">sharing</span>
      ) : null}
      <section className="section">
        <h1>Peer video</h1>
        {Object.keys(this.state.peers).map((id) => (
          <video
            autoPlay
            muted
            playsInline
            key={`${id}-video`}
            id={`${id}-video`}
            style={{
              width: "250px",
              height: "200px",
              border: "1px solid gray",
              margin: "1rem",
            }}
            ref={(video) => (this.peerVids[id] = video)}
          />
        ))}
      </section>
    </section>
  )
}
