import React from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Chat from "./pages/Chat"
import KtvDashboard from "./pages/KtvDashboard"
export default function App() {
  return (
    <Router>
      <nav
        className="navbar is-light"
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-brand">
          <h1 className="navbar-item">Video Chat</h1>
        </div>
      </nav>
      <Switch>
        <Route exact path="/chat">
          <Chat />
        </Route>
        <Route exact path="/">
          <KtvDashboard />
        </Route>
      </Switch>
    </Router>
  )
}
