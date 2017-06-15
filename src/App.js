import React from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Header from './Header';
import Download from './Download';

export default () =>
  <Router>
    <div>
      <Header />
      <Route exact path="/" component={Download} />
      <Route path="/else" component={() => <div>something else</div>} />
    </div>
  </Router>;
