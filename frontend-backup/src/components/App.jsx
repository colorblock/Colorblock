import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { 
  BrowserRouter as Router, 
  Route,
  useParams
} from 'react-router-dom';
import Notifications from './Notifications';
import ModalContainer from './Modal';
import CreatePage from './CreatePage';
import HomePage from './HomePage';
import ItemPage from './ItemPage';
import UserPage from './UserPage';
import Spinner from './Spinner';
import { getDataFromStorage } from '../utils/storage';
import { setAccount } from '../store/actions/actionCreators';

const App = props => {

  const { account, loading } = props;
  const [modalType, setModalType] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const changeModalType = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    const init = () => {
      const dataStored = getDataFromStorage(localStorage);
      if (dataStored.account) {
        const { setAccount } = props;
        setAccount(dataStored.account);
      }
    };
    init();
  }, []);

  return (
    <Router>
    <Spinner />
    <Notifications />
    <div 
      className="app__main"
      style={{
        display: loading ? 'none' : 'block'
      }}
    >
      <header> 
        <div className="left col-1-3">
          <h1><a href='/'>COLORBLOCK</a></h1>
        </div>
        <div className="right col-2-3">
          <div className="wallet-entry">
            <button
              type='button'
              onClick={() => {
                changeModalType('wallet');
              }}
            >
            { account ? 
              `${account.slice(0, 4)}**${account.slice(-4)}` :
              'connect to wallet' 
            }
            </button>
            { account &&
              <button
                type='button'
                onClick={ () => (window.location.href=`/user/${account}`) }
              >
              Mine
              </button>
            }
            <button
              type='button'
              onClick={ () => (window.location.href='/create') }
            >
            Create
            </button>
          </div>
        </div>
      </header>
      <ModalContainer
        type={modalType}
        isOpen={modalOpen}
        close={closeModal}
        open={() => {
          changeModalType(modalType);
        }}
      />

      <Route path='/' exact>
        <HomePage />
      </Route>

      <Route path='/create'>
        <CreatePage 
          modalType={ modalType }
          modalOpen={ modalOpen }
          changeModalType={ changeModalType }
          dispatch={ props.dispatch }
        />
      </Route>

      <Route path='/item/:id' exact>
        <ItemPage />
      </Route>
      <Route path='/user/:id' exact>
        <UserPage />
      </Route>

    </div>
    </Router>
  );
}

const mapStateToProps = state => ({
  account: state.present.get('account'),
  loading: state.present.get('loading')
});
const mapDispatchToProps = dispatch => ({
  setAccount: (account) => dispatch(setAccount(account))
})

export default connect(mapStateToProps, mapDispatchToProps)(App);