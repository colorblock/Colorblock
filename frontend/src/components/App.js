import React, { useState, useEffect } from 'react';
import { Route, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactLoading from 'react-loading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

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
import { gaTrackingID, devMode } from '../config';
import { createBaseMsg, hideLoading } from '../store/actions/actionCreator';
import * as types from '../store/actions/actionTypes';


ReactGA.initialize(gaTrackingID, {
  debug: devMode
});

const usePageViews = () => {
  const location = useLocation();
  useEffect(() => {
    ReactGA.set({ page: location.pathname }); // Update the user's current page
    ReactGA.pageview(location.pathname + location.search); // Record a pageview for the given page
  }, [location]);
};

const App = (props) => {

  const { loading, loadingText, hideLoading } = props;
  
  const [layoutLoading, setLayoutLoading] = useState({
    header: false,
    footer: false
  });  // shows when layout is loading
  const [intervalId, setIntervalId] = useState(null);

  const isLayoutLoaded = !layoutLoading.header && !layoutLoading.footer;

  usePageViews();

  useEffect(() => {
    const setupWindow = () => {
      window.addEventListener('message', handleMessage);
    };
    const handleMessage = (event) => {
      const data = event.data;
      const source = data.source || '';
      if (source.startsWith('colorful') && data.context === 'app' && data.action === types.GET_EXTENSION_INFO) {
        console.log('in handle message in app get extension info', data);
      }
      else if (source.startsWith('colorful') && data.action === types.CANCEL_SIGNING) {
        toast.error(data.data);
        hideLoading();
      }
    };

    const getExtensionInfo = () => {
      const msg = createBaseMsg();
      window.postMessage({
        ...msg,
        action: types.GET_EXTENSION_INFO,
        context: 'app'
      });
    };

    setupWindow();
    getExtensionInfo();

    return () => {
      // Unbind the event listener on clean up
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (loading && !intervalId) {
      const msg = createBaseMsg();
      const id = setInterval(() => window.postMessage({...msg, scene: 'buffer'}), 5000);
      setIntervalId(id);
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [loading]);

  return (
    <div data-role='app container' className='px-12 font-work'>
      <div 
        className={isLayoutLoaded ? '' : 'fixed w-full h-full flex items-center justify-center bg-white'}
        hidden={isLayoutLoaded}
      >
        <ReactLoading type='spin' color='rgb(254, 94, 174)' height='50px' width='50px' className='-mt-20' />
      </div>
      <div hidden={!isLayoutLoaded}>
        <Header 
          onLoading={ () => setLayoutLoading({...layoutLoading, header: true}) } 
          onLoaded={ () => setLayoutLoading({...layoutLoading, header: false}) } 
        />
        <Wallet />
        <ToastContainer position='top-center' />
        { loading && 
          <div 
            className='w-full bg-white'
          >
            <div className='w-80 h-80 mx-auto mt-32 flex flex-col items-center justify-center relative border mb-20 p-10'>
              <ReactLoading type='cubes' color='rgb(254, 94, 174)' height='60px' width='60px' className='mt-10' />
              <span className='text-lg mt-5'>{ loadingText || '' }</span>
              <div className='absolute top-4 right-4 text-gray-300 flex items-center cursor-pointer' onClick={ () => hideLoading() }>
                <FontAwesomeIcon icon={fa.faTimes} size='2x' />
              </div>
            </div>
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
      </div>
    </div>
  );
};

App.propTypes = {
  loading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading,
  loadingText: state.root.loadingText
});

const mapDispatchToProps = dispatch => ({
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

