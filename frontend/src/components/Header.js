import React from 'react';


const Header = () => (
  <header> 
    <div className="left col-2-3">
      <h1>COLORBLOCK</h1>
    </div>
    <div className="right col-1-3">
      <div className="wallet-entry">
        <button
          type='button'
        >
        connect to wallet
        </button>
      </div>
    </div>
  </header>
);

export default Header;
