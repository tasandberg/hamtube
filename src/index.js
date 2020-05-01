import React from "react"
import ReactDOM from "react-dom"
import "./client/styles/main.scss"
import * as Sentry from '@sentry/browser'
import App from "./client/App"
import * as serviceWorker from "./serviceWorker"

Sentry.init({dsn: "https://8ded74c66ee74d589ba27f73c77aea11@o386413.ingest.sentry.io/5220673"});
if (process.env.NODE_ENV !== "production") {
  localStorage.setItem("debug", "Hamtube:*")
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
