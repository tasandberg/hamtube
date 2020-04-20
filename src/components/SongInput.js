import React, { useState, Fragment } from "react"
import classNames from "classnames"
import { validUrl, extractVideoData } from "../util/youtube-data"

export default ({ isActive, close, activate, addSongValue }) => {
  const [inputValue, setInputValue] = useState("Add Song")
  const [placeholder, setPlaceholder] = useState(null)
  const [linkPreview, setLinkPreview] = useState(null)

  const onFocus = () => {
    setPlaceholder("Paste a YouTube link")
    setInputValue("")
  }

  const onBlur = () => {
    setPlaceholder(null)
    setInputValue("Add Song")
    close()
  }

  const getLinkPreview = (url) => {
    extractVideoData(url).then((response) => {
      const { error, data } = response
      if (data.error) {
        console.log(error)
        setLinkPreview(null)
      } else if (data.thumbnail_url || data.title) {
        console.log(data)

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

  return (
    <div className="song-input-wrapper">
      <div className={classNames("input-wrapper", { active: isActive })}>
        <div className="input-container" onClick={activate}>
          <i className="fas fa-music" />
          <input
            focusable={isActive}
            className="input"
            type="text"
            value={inputValue}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={placeholder}
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
                    </div>
                  </div>
                </article>
              ) : (
                <span style={{ marginLeft: "2rem" }}>
                  <i className="far fa-surprise fa-fw" /> Can't find this video.
                  Try adding a different one.
                </span>
              )}
            </div>
          </Fragment>
        ) : null}
      </div>
    </div>
  )
}
