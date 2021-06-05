import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { getSignedCmd } from '../../utils/sign';
import { serverUrl, contractModules } from '../../config';

const AssetPage = (props) => {
  const { assetId } = useParams();
  const { wallet } = props;
  const [asset, setItem] = useState(null);
  const [releaseData, setReleaseData] = useState({
    price: null,
    amount: null
  });

  const onRelease = async () => {
    const { price, amount } = releaseData;
    console.log(amount, asset.balance);
    if (amount > asset.balance) {
      alert(`Balance ${asset.balance} is not sufficient for this ${amount}`);
    }
    
    // post release request
    const itemId = asset.item.id;
    const seller = wallet.address;
    const cmd = {
      code: `(${contractModules.colorblockMarket}.release (read-msg "token") (read-msg "seller") (read-msg "price") (read-msg "amount"))`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: `${contractModules.colorblock}.TRANSFER`,
          args: [itemId, seller, contractModules.marketPoolAccount, amount]
        }
      }, {
        role: 'Pay Gas',
        description: 'Pay Gas',
        cap: {
          name: `${contractModules.colorblockGasStation}.GAS_PAYER`,
          args: ['colorblock-gas', {int: 1.0}, 1.0]
        }
      }
      ],
      sender: contractModules.gasPayerAccount,
      signingPubKey: seller,
      data: {
        token: itemId,
        seller,
        price,
        amount
      }
    };
    const signedCmd = await getSignedCmd(cmd);

    console.log('get signedCmd', signedCmd);
    if (!signedCmd) {
      return;
    }
    const result = await fetch(`${serverUrl}/asset/release`, signedCmd).then(res => res.json());
    console.log('get result', result);
    if (result.status === 'success') {
      alert('release successfully');
      document.location.href = document.location.href;
    } else {
      alert(result.data);
    }
  };

  const onRecall = async () => {
    // post recall request
    const itemId = asset.item.id;
    const seller = wallet.address;
    const amount = asset.deal.remain;
    const cmd = {
      code: `(${contractModules.colorblockMarket}.recall (read-msg "token") (read-msg "seller"))`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: `${contractModules.colorblock}.AUTH`,
          args: [itemId, seller]
        }
      }, {
        role: 'Pay Gas',
        description: 'Pay Gas',
        cap: {
          name: `${contractModules.colorblockGasStation}.GAS_PAYER`,
          args: ['colorblock-gas', {int: 1.0}, 1.0]
        }
      }
      ],
      sender: contractModules.gasPayerAccount,
      signingPubKey: seller,
      data: {
        token: itemId,
        seller
      }
    };
    const signedCmd = await getSignedCmd(cmd);

    console.log('get signedCmd', signedCmd);
    if (!signedCmd) {
      return;
    }
    const result = await fetch(`${serverUrl}/asset/recall`, signedCmd).then(res => res.json());
    console.log('get result', result);
    if (result.status === 'success') {
      alert('release successfully');
      document.location.href = document.location.href;
    } else {
      alert(result.data);
    }
  };

  useEffect(() => {
    const fetchItem = async (assetId) => {
      const url = `${serverUrl}/asset/${assetId}`;
      const assetData = await fetch(url).then(res => res.json());
      assetData.url = `${serverUrl}/static/img/${assetData.item.id}.${assetData.item.type === 0 ? 'png' : 'gif'}`;
      setItem(assetData);
    };

    fetchItem(assetId);
  }, [assetId]);

  return asset ? (
    <div>
      <p>Asset ID: {assetId}</p>
      <p>Item ID: {asset.item.id}</p>
      <p>Item title: {asset.item.title}</p>
      <p>Item tags: {asset.item.tags}</p>
      <p>Item description: {asset.item.description}</p>
      <p>Item creator: <a href={`/user/${asset.item.creator}`}>{asset.item.creator}</a></p>
      <p>Item owner: <a href={`/user/${asset.user_id}`}>{asset.user_id}</a></p>
      <div>
        <img src={asset.url} className='w-40' alt={asset.item.title} />
      </div>
      {
        asset.user_id === wallet.address && asset.deal.open === false &&
        <div data-role='market board' className='flex space-x-3 items-center'>
          <span>Price</span>
          <input 
            type='number' 
            className='py-2 border rounded' 
            onChange={ (e) => setReleaseData({...releaseData, price: parseFloat(e.target.value) }) } 
          />
          <span>Amount</span>
          <input 
            type='number' 
            className='py-2 border rounded' 
            onChange={ (e) => setReleaseData({...releaseData, amount: parseFloat(e.target.value) }) }
          />
          <button
            className='px-3 py-2 bg-cb-pink text-white'
            onClick={ () => onRelease() }
          >
            Release
          </button>
        </div>
      }
      
      {
        asset.user_id === wallet.address && asset.deal.open === true &&
        <div data-role='market board' className='flex space-x-3 items-center'>
          <p>Deal total amount: {asset.deal.total}</p>
          <p>Deal remain amount: {asset.deal.remain}</p>
          <button
            className='px-3 py-2 bg-cb-pink text-white'
            onClick={ () => onRecall() }
          >
            Recall
          </button>
        </div>
      }
    </div>
  ) : <></>;
};

AssetPage.propTypes = {
};

const mapStateToProps = state => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetPage);
