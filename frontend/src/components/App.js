import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import exampleFrames from '../assets/exampleFrames';
import { loadProject } from '../store/actions/actionCreator';
import Header from './layout/Header';
import Footer from './layout/Footer';
import HomePage from './home/HomePage';
import CreatorPage from './creator/CreatorPage';
import MarketPage from './market/MarketPage';
import ItemPage from './item/ItemPage';
import Wallet from './context/Wallet';
import { hasStateInCookies } from '../utils/storage';

const App = (props) => {

  const { loadProject } = props;

  useEffect(() => {
    const init = async () => {
      // if there's no state in cookies, then load reserved project
      if (!hasStateInCookies()) {
        loadProject(exampleFrames);
      }
    };

    init();
  }, [loadProject]);

  return (
    <div data-role='app container' className='px-12 font-work'>
      <Router>
        <Header />
        <Wallet />
        <Route path='/' exact>
          <HomePage />
        </Route>
        <Route path='/create'>
          <CreatorPage />
        </Route>
        <Route path='/market'>
          <MarketPage />
        </Route>
        <Route path='/item/:itemId'>
          <ItemPage />
        </Route>
        <Footer />
      </Router>
    </div>
  );
};

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
  loadProject: (frames) => dispatch(loadProject(frames))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

