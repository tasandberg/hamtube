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

export default () => {
  return (
    <div style={{ marginTop: "0px", flexWrap: "wrap", height: "100vh" }}>
      <div
        style={{ height: videos.length > 4 ? "50vh" : "75vh" }}
        className="has-background-dark has-text-light"
      >
        <span>Main video</span>
      </div>
      <div className="tile is-ancestor is-gapless">
        <div className="tile is-parent is-vertical">
          <div
            className="tile is-parent"
            style={{ maxHeight: "25vh", flexWrap: "wrap " }}
          >
            {videos.slice(0, 4).map((v, i) => (
              <div
                style={{ height: "25vh" }}
                className={`tile is-child ${v}`}
                key={`video-${i + 1}`}
              >
                Video {i + 1}
              </div>
            ))}
          </div>
          <div
            className="tile is-parent"
            style={{ maxHeight: "25vh", flexWrap: "wrap " }}
          >
            {videos.slice(4, 8).map((v, i) => (
              <div
                style={{ height: "25vh" }}
                className={`tile is-child ${v}`}
                key={`video-${i + 1}`}
              >
                Video {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
