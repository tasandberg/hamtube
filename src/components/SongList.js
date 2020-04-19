import React from "react"
import classNames from "classnames"

export default ({ isActive, close }) => (
  <div
    className={classNames("song-list-modal-wrapper", { "is-active": isActive })}
    onClick={close}
  >
    <div className="song-list-modal-inner" onClick={close}>
      <div className="song-list-modal">
        <h3 className="title is-4">Add a song</h3>
        <input className="input" type="text" placeholder="Add a song!" />
        <hr />
      </div>
    </div>
  </div>
)
