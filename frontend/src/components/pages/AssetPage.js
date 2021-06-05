import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { getSignedCmd } from '../../utils/sign';
import { serverUrl, contractModules, marketConfig } from '../../config';

const AssetPage = (props) => {
  const { assetId } = useParams();
  const { wallet } = props;
  const [asset, setItem] = useState(null);
  const [releaseData, setReleaseData] = useState({
    price: null,
    amount: null
  });
  const [purchaseAmount, setPurchaseAmount] = useState(null);

  const onRelease = async () => {
    const { price, amount } = releaseData;
    if (amount > asset.balance) {
      alert(`Balance ${asset.balance} is not sufficient for this ${amount}`);
    }
    
    // post release request
    const itemId = asset.item.id;
    const seller = wallet.address;
    const cmd = {
      code: `(${contractModules.colorblockMarket}.release (read-msg "token") (read-msg "seller") (read-msg "price") (read-msg "amount"))`,
      caps: [{
        role: 'Transfer',
        description: 'Transfer item to market pool',
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

  const onPurchase = async () => {
    // post recall request
    const itemId = asset.item.id;
    const buyer = wallet.address;
    const seller = asset.deal.user_id;
    const price = asset.deal.price;
    const amount = purchaseAmount;
    if (amount > asset.deal.remain) {
      alert(`Purchase amount must not exceed deal's remained amount`);
    }

    const ownershipResult = await fetch(`${serverUrl}/asset/owned-by/${buyer}`).then(res => res.json());
    let code;
    const preparedData = {};
    if (ownershipResult.length === 0) {
      // if buyer has no matched asset, then use purchase-new-account
      code = `(${contractModules.colorblockMarket}.purchase-new-account (read-msg "token") (read-msg "buyer") (read-msg "seller") (read-msg "price") (read-msg "amount") (read-keyset "buyerKeyset"))`
      preparedData.buyerKeyset = { 
        keys: [buyer],
        pred: 'keys-all'
      };
    } else {
      code = `(${contractModules.colorblockMarket}.purchase (read-msg "token") (read-msg "buyer") (read-msg "seller") (read-msg "price") (read-msg "amount"))`
    }

    const paidToSeller = amount * price;
    const paidToPool = paidToSeller * marketConfig.fees;
    const cmd = {
      code,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: `${contractModules.colorblock}.AUTH`,
          args: [itemId, buyer]
        }
      }, {
        role: 'Transfer',
        description: 'Transfer payment to seller',
        cap: {
          name: `coin.TRANSFER`,
          args: [buyer, seller, paidToSeller]
        }
      }, {
        role: 'Transfer',
        description: 'Transfer fees to market pool',
        cap: {
          name: `coin.TRANSFER`,
          args: [buyer, contractModules.marketPoolAccount, paidToPool]
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
      signingPubKey: buyer,
      data: {
        token: itemId,
        buyer,
        seller,
        price,
        amount,
        ...preparedData
      }
    };
    const signedCmd = await getSignedCmd(cmd);

    console.log('get signedCmd', signedCmd);
    if (!signedCmd) {
      return;
    }
    const result = await fetch(`${serverUrl}/asset/purchase`, signedCmd).then(res => res.json());
    console.log('get result', result);
    if (result.status === 'success') {
      alert('release successfully');
      const newAssetId = result.data.assetId;
      document.location.href = `/asset/${newAssetId}`;
    } else {
      alert(result.data);
    }
  };

  useEffect(() => {
    const fetchItem = async (assetId) => {
      const url = `${serverUrl}/asset/${assetId}`;
      const assetData = await fetch(url).then(res => res.json());
      assetData.url = `${serverUrl}/static/img/${assetData.item.id}.${assetData.item.type === 0 ? 'png' : 'gif'}`;
      assetData.dealOpen = assetData.deal ? assetData.deal.open : false;
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
        asset.user_id === wallet.address && asset.dealOpen === false &&
        <div data-role='market board' className='flex space-x-3 items-center'>
          <span>Price</span>
          <input 
            type='number' 
            className='py-2 border rounded' 
            onChange={ (e) => setReleaseData({...releaseData, price: parseFloat(e.target.value) }) } 
          />
          <span>Amount ({asset.balance} available)</span>
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
        asset.user_id === wallet.address && asset.dealOpen === true &&
        <div data-role='market board' className='flex flex-col space-y-3 items-center'>
          <p>Deal seller: {asset.deal.user_id}</p>
          <p>Deal price: {asset.deal.price}</p>
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
      {
        asset.user_id !== wallet.address && asset.dealOpen === true &&
        <div data-role='market board' className='flex flex-col space-y-3 items-center'>
          <p>Deal seller: {asset.deal.user_id}</p>
          <p>Deal price: {asset.deal.price}</p>
          <p>Deal total amount: {asset.deal.total}</p>
          <p>Deal remain amount: {asset.deal.remain}</p>
          <span>Amount</span>
          <input 
            type='number' 
            className='py-2 border rounded' 
            onChange={ (e) => setPurchaseAmount(parseFloat(e.target.value)) }
          />
          <button
            className='px-3 py-2 bg-cb-pink text-white'
            onClick={ () => onPurchase() }
          >
            Purchase
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
