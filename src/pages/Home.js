import React from "react"
import classNames from "classnames"
export default class Home extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      validCode: false,
      roomCodeInput: "",
    }
  }

  hasValidCode = (e) => {
    this.setState({
      validCode: e.currentTarget.value.length === 8,
      roomCodeInput: e.currentTarget.value,
    })
  }

  render = () => (
    <section className="hero is-info is-fullheight">
      <div className="hero-body">
        <div className="container">
          <h1 className="title is-1">
            Hamtube{" "}
            <i style={{ marginleft: "5px" }} className="fas fa-bacon fa-fw" />
          </h1>
          <h2 className="subtitle">Ham it up!</h2>
          <div className="columns">
            <div className="column">
              <div className="card has-text-black">
                <div className="card-content has-text-black">
                  <p className="title has-text-black">Create a room</p>
                  <a href="/chat/new" className="button is-success">
                    Create a room
                  </a>
                </div>
              </div>
            </div>
            <div className="column">
              <div className="card has-text-black">
                <div className="card-content has-text-black">
                  <p className="title has-text-black">Join a room</p>
                  <div className="field is-horizontal">
                    <div className="field-body">
                      <div className="field">
                        <div className="control is-expanded has-icons-right">
                          <input
                            className="input"
                            type="text"
                            placeholder="Enter a room code"
                            onChange={this.hasValidCode}
                            value={this.state.roomCodeInput}
                            ref={(el) => (this.roomCodeInput = el)}
                          ></input>
                          <span className="icon is-right">
                            <i
                              className={classNames("fas fa-check", {
                                "has-text-success": this.state.validCode,
                              })}
                            />
                          </span>
                        </div>
                      </div>
                      <div className="field">
                        <div className="field-body">
                          <div className="control is-expanded">
                            <a
                              disabled={!this.state.validCode}
                              className="button is-success"
                              href={`/${this.state.roomCodeInput}`}
                            >
                              Go!
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
