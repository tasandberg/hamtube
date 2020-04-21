import React from "react"

export default ({ notification }) => (
  <div className="notification-bar-wrapper">
    {notification ? (
      <div className="notification-bar fadeInOut">
        <span>{notification}</span>
      </div>
    ) : null}
  </div>
)
