import React, { useState } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactLoading from 'react-loading';

import Header from './layout/Header';
import Footer from './layout/Footer';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import MarketPage from './pages/MarketPage';
import SearchPage from './pages/SearchPage';
import ItemPage from './pages/ItemPage';
import AssetPage from './pages/AssetPage';
import CollectionPage from './pages/CollectionPage';
import UserPage from './pages/UserPage';
import Wallet from './common/Wallet';
import ContactPage from './pages/ContactPage';

const App = (props) => {

  const { loading } = props;
  
  const [layoutLoading, setLayoutLoading] = useState({
    header: false,
    footer: false
  });  // shows when layout is loading

  const isLayoutLoaded = !layoutLoading.header && !layoutLoading.footer;

  return (
    <div data-role='app container' className='px-12 font-work'>
      <div 
        className={isLayoutLoaded ? '' : 'fixed w-full h-full flex items-center justify-center bg-white'}
        hidden={isLayoutLoaded}
      >
        <ReactLoading type='spin' color='rgb(254, 94, 174)' height='50px' width='50px' className='-mt-20' />
      </div>
      <Router hidden={!isLayoutLoaded}>
        <Header 
          onLoading={ () => setLayoutLoading({...layoutLoading, header: true}) } 
          onLoaded={ () => setLayoutLoading({...layoutLoading, header: false}) } 
        />
        <Wallet />
        <ToastContainer position='top-center' />
        { loading && 
          <div 
            className='w-full h-80 flex items-center justify-center bg-white'
          >
            <ReactLoading type='cubes' color='rgb(254, 94, 174)' height='50px' width='50px' className='mt-20' />
          </div>
        }
        <Route path='/' exact>
          <HomePage />
        </Route>
        <Route path='/create'>
          <CreatorPage />
        </Route>
        <Route path='/market/:type'>
          <MarketPage />
        </Route>
        <Route path='/search/:keyword'>
          <SearchPage />
        </Route>
        <Route path='/item/:itemId'>
          <ItemPage />
        </Route>
        <Route path='/asset/:assetId'>
          <AssetPage />
        </Route>
        <Route path='/collection/:collectionId'>
          <CollectionPage />
        </Route>
        <Route path='/user' exact>
          <UserPage />
        </Route>
        <Route path='/user/:userId'>
          <UserPage />
        </Route>
        <Route path='/contact'>
          <ContactPage />
        </Route>
        <Footer 
          onLoading={ () => setLayoutLoading({...layoutLoading, footer: true}) } 
          onLoaded={ () => setLayoutLoading({...layoutLoading, footer: false}) } 
        />
      </Router>
    </div>
  );
};

App.propTypes = {
  loading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

