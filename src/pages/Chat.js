import React from "react"
import io from "socket.io-client"
import Peer from "simple-peer"
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

    this.state = {
      name: undefined,
      peers: {},
    }
  }

  componentDidMount() {
    console.log("Initializing client")
    const socket = io("http://localhost:4000")
    this.socket = socket

    socket.on("connect", () => {
      console.log("Connected to signalling server, Peer ID: %s", socket.id)

      /* On connect, we will send and receive data from all connected peers */
      socket.on("peer", (data) => {
        const peerId = data.peerId
        const peer = new Peer({
          initiator: data.initiator,
          trickle: true,
          objectMode: true,
        })

        console.log(
          "Peer available for connection discovered from signalling server, Peer ID: %s",
          peerId
        )

        /* Handle receiving signal from new peer */
        socket.on("signal", (data) => {
          if (data.peerId === peerId) {
            console.log("Received signalling data from PeerId:", peerId)
            peer.signal(data.signal)
          }
        })

        /* Allow peer to handle receiving signal from this peer */
        /**
         * 1. This peer sends signal (automatic)
         * 2. Our instance of peerX here receives signal event
         * 3. Pass data through socket.io so that it is received by the other client
         */
        peer.on("signal", function (data) {
          console.log("Signal", data, "to Peer ID:", peerId)
          socket.emit("signal", {
            signal: data,
            peerId: peerId,
          })
        })
        peer.on("connect", function () {
          console.log("Peer connection established")
          peer.send("We made it")
        })

        peer.on("stream", function (stream) {
          socket.emit("stream", peerId, stream)
        })

        peer.on("data", (data) => {
          console.log(data)
        })
      })
    })
  }

  startLocalVideo() {
    navigator.mediaDevices
      .getUserMedia(vidOptions)
      .then((stream) => {
        this.localVideo.srcObject = stream
      })
      .catch((e) => console.log(e))
  }

  addPeer(id, peer) {
    this.setState(({ peers }) => ({
      peers: {
        ...peers,
        [id]: peer,
      },
    }))
  }

  setName = () => {
    this.socket.emit("set-name", this.nameBox.value)
    this.setState({
      name: this.nameBox.value,
    })
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
        <div className="column is-four-fifths">
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
      <section className="section">
        <h1>Peer video</h1>
        <video
          autoPlay
          muted
          playsInline
          ref={(video) => (this.remoteVideo = video)}
        />
      </section>
    </section>
  )
}
