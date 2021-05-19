import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import HomePage from './home/HomePage';
import CreatorPage from './creator/CreatorPage';
import exampleFrames from '../assets/exampleFrames';
import { loadProject } from '../store/actions/actionCreator';
import Header from './layout/Header';
import Wallet from './context/Wallet';

const App = (props) => {

  const { loadProject } = props;

  useEffect(() => {
    const init = async () => {
      loadProject(exampleFrames);
    };

    init();
  }, [loadProject]);

  return (
    <Router>
      <Header />
      <Wallet />
      <Route path='/' exact>
        <HomePage />
      </Route>
      <Route path='/create'>
        <CreatorPage />
      </Route>
    </Router>
    
  );
};

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  loadProject: (frames) => dispatch(loadProject(frames))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

