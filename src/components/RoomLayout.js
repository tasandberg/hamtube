import React from "react"

const videos = [
  "has-background-primary",
  // "has-background-info",
  // "has-background-warning",
  // "has-background-danger",
  // "has-background-success",
  // "has-background-primary",
  // "has-background-link",
  // "has-background-light",
  // "has-background-grey-light",
  // "has-background-primary",
  // "has-background-danger",
  // "has-background-success",
]

const PeerVid = ({ peer }) => (
  <video
    autoPlay
    className="has-background-black has-text-white"
    muted={peer.muted}
    playsInline
    id={`${peer.id}-video`}
    style={{
      width: "100%",
    }}
  >
    asdfasdf
  </video>
)

export default ({ peers, userStream }) => {
  return (
    <div style={{ marginTop: "0px", flexWrap: "wrap", height: "100vh" }}>
      <div
        style={{ height: videos.length > 4 ? "50vh" : "75vh" }}
        className="has-background-dark has-text-light"
      ></div>
      <div className="tile is-ancestor is-gapless">
        <div className="tile is-parent is-vertical">
          <div className="tile is-parent" style={{ flexWrap: "wrap " }}>
            <div className={`tile is-child`}>
              <video
                autoPlay
                className="has-background-black has-text-white"
                playsInline
                id="local-video"
                style={{
                  width: "100%",
                }}
              >
                asdfasdf
              </video>
            </div>
            {peers.slice(0, 4).map((peer, i) => (
              <div
                style={{ width: "100%" }}
                className={`tile is-child`}
                key={`video-${i}`}
              >
                <PeerVid peer={peer} />
              </div>
            ))}
          </div>
          <div className="tile is-parent" style={{ flexWrap: "wrap " }}>
            {peers.slice(4, 8).map((peer, i) => (
              <div className={`tile is-child`}>
                <PeerVid peer={peer} id={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
