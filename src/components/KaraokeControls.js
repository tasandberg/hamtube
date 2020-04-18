import React from "react"

export default () => {
  return (
    <div className="karaoke-controls-container">
      <button
        id="karaoke-invite-btn"
        className="karaoke-controls-btn is-large button is-primary is-outline"
      >
        <i className="fas fa-user-plus"></i>
      </button>
      <button
        id="karaoke-playlist-btn"
        className="karaoke-controls-btn is-large button is-primary is-outline"
      >
        <i className="fas fa-music"></i>
      </button>
    </div>
  )
}
