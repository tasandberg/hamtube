import React from "react"

export default ({ notification, upNext }) => (
  <div className="notification-bar-wrapper">
    {notification ? (
      <div className="notification-bar fadeInOut">
        <span>{notification}</span>
      </div>
    ) : (
      <div className="notification-bar">
        <span>{upNext}</span>
      </div>
    )}
  </div>
)
