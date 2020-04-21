import React, { useState, Fragment } from "react"
import classNames from "classnames"
import { validUrl, extractVideoData } from "../util/youtube-data"

export default ({
  isActive,
  close,
  activate,
  addSong,
  songInputNotification,
}) => {
  const [inputValue, setInputValue] = useState("Add Song")
  const [placeholder, setPlaceholder] = useState(null)
  const [linkPreview, setLinkPreview] = useState(null)

  const onFocus = () => {
    setPlaceholder("Paste a YouTube link")
    setInputValue("")
  }

  const onBlur = ({ currentTarget }) => {
    // TODO Fix this to allow clicking on preview to add
    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        closeInput()
      }
    }, 0)
  }

  const getLinkPreview = (url) => {
    extractVideoData(url).then((response) => {
      const { error, data } = response
      if (data.error) {
        console.log(error)
        setLinkPreview(null)
      } else if (data.thumbnail_url || data.title) {
        setLinkPreview(data)
      }
    })
  }

  const onInputChange = (e) => {
    const value = e.currentTarget.value

    if (validUrl(value)) {
      getLinkPreview(value)
    } else {
      setLinkPreview(null)
    }

    setInputValue(value)
  }

  const closeInput = () => {
    setPlaceholder(null)
    setInputValue("Add Song")
    close()
    document.activeElement.blur()
  }

  const keyDownHandler = (e) => {
    if (e.keyCode === 13 && linkPreview) {
      addSong(linkPreview)
      closeInput()
    } else if (e.keyCode === 27) {
      closeInput()
    }
  }

  return (
    <div className="song-input-wrapper">
      <div className="song-input-wrapper-inner">
        <div
          className={classNames("input-wrapper", { active: isActive })}
          onBlur={onBlur}
        >
          <div className="input-container" onClick={activate}>
            <i className="fas fa-music" />
            <input
              focusable={isActive}
              className="input"
              type="text"
              value={inputValue}
              onFocus={onFocus}
              placeholder={placeholder}
              onKeyDown={keyDownHandler}
              onChange={onInputChange}
            />
          </div>

          {inputValue !== "" && isActive ? (
            <Fragment>
              <hr style={{ margin: "0 auto", width: "95%" }} />
              <div className="add-song-feedback">
                {linkPreview ? (
                  <article
                    className="media"
                    key={`${linkPreview.title}-preview`}
                    style={{ paddingBottom: "1rem" }}
                    onClick={() => console.log("weeee clicked")}
                  >
                    <figure className="media-left">
                      <p className="image is-96x96">
                        <img
                          alt="video preview"
                          src={linkPreview.thumbnail_url}
                        />
                      </p>
                    </figure>
                    <div className="media-content">
                      <div className="content">
                        <b>{linkPreview.title}</b>
                        <br />
                        {linkPreview ? (
                          <span className="is-size-7">
                            press [enter] to add
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ) : (
                  <span>
                    <span role="img" aria-label="ogre icon">
                      👹
                    </span>{" "}
                    Can't find this video. Try adding a different one.
                  </span>
                )}
              </div>
            </Fragment>
          ) : null}
        </div>
        {songInputNotification ? (
          <div className="song-input-notification-wrapper fadeInOut">
            <div className="song-input-notification">
              <span className="fadeInOut">{songInputNotification}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
