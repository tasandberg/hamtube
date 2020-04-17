import React from "react"
import classNames from "classnames"

export default ({ isActive, closeModal }) => (
  <div
    className={classNames("song-list-modal-wrapper", { "is-active": isActive })}
    onClick={closeModal}
  >
    <div className="song-list-modal-inner" onClick={null}>
      <div className="song-list-modal">
        <h3 className="title is-4">Upcoming Songs</h3>
        <input className="input" type="text" placeholder="Add a song!" />
        <hr />
      </div>
    </div>
  </div>
)
