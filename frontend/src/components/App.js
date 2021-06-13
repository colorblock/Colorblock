import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  return (
    <div data-role='app container' className='px-12 font-work'>
      <Router>
        <Header />
        <Wallet />
        <ToastContainer
          position='top-center'
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
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
        <Footer />
      </Router>
    </div>
  );
};

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

