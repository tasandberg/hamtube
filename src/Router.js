import React from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Chat from "./pages/Chat"
import KtvDashboard from "./pages/KtvDashboard"
import Home from "./pages/Home"

export default function App() {
  return (
    <Router>
      <nav
        className="navbar is-light"
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-brand">
          <h1 className="navbar-item">
            Hamtube{" "}
            <i
              style={{ marginLeft: "3px" }}
              className="fas fa-fw fa-sm has-text-danger fa-bacon"
            />
          </h1>
        </div>
      </nav>
      <Switch>
        <Route exact path="/chat">
          <Chat />
        </Route>
        <Route exact path="/ktv">
          <KtvDashboard />
        </Route>
        <Route exact path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  )
}
