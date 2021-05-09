import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import HomePage from './home/HomePage';
import CreatorPage from './creator/CreatorPage';
import exampleFrames from '../assets/exampleFrames';
import { loadProject } from '../store/actions/actionCreator';

const App = (props) => {

  useEffect(() => {
    const init = async () => {
      const { loadProject } = props; 
      loadProject(exampleFrames);
    };

    init();
  }, []);

  return (
    <Router>
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

