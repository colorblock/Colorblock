import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { connect } from 'react-redux';

import Header from './layout/Header';
import Footer from './layout/Footer';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import MarketPage from './pages/MarketPage';
import ItemPage from './pages/ItemPage';
import UserPage from './pages/UserPage';
import Wallet from './common/Wallet';

const App = (props) => {

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
        <Route path={['/market', '/search/:keyword']}>
          <MarketPage />
        </Route>
        <Route path='/item/:itemId'>
          <ItemPage />
        </Route>
        <Route path={['/user', '/user/:userId']}>
          <UserPage />
        </Route>
        <Footer />
      </Router>
    </div>
  );
};

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

