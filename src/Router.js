import React from "react"
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"
import Chat from "./pages/Chat"
import KtvDashboard from "./pages/KtvDashboard"
import Home from "./pages/Home"
import Room from "./pages/Room"

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/chat">
          <Chat />
        </Route>
        <Route exact path="/room/:roomId" component={Room} />
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
