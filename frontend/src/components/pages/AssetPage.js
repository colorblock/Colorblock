import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { getSignedCmd } from '../../utils/sign';
import { serverUrl, contractModules, marketConfig } from '../../config';
import { shortAddress } from '../../utils/polish';
import { toPricePrecision, toAmountPrecision } from '../../utils/tool';

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
    const price = toPricePrecision(releaseData.price);
    const amount = toAmountPrecision(releaseData.amount);
    if (amount > asset.balance) {
      alert(`Balance ${asset.balance} is not sufficient for this ${amount}`);
      return;
    }
    
    // post release request
    const itemId = asset.item.id;
    const seller = wallet.address;
    const cmd = {
      code: `(${contractModules.colorblockMarket}.release (read-msg "token") (read-msg "seller") (read-decimal "price") (read-decimal "amount"))`,
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
    const price = toPricePrecision(asset.deal.price);
    const amount = toAmountPrecision(purchaseAmount);
    if (amount > asset.deal.remain) {
      alert(`Purchase amount must not exceed deal's remained amount`);
      return;
    }

    const ownershipResult = await fetch(`${serverUrl}/item/${itemId}/is-owned-by/${buyer}`).then(res => res.json());
    let code;
    const preparedData = {};
    if (ownershipResult.result === true) {
      code = `(${contractModules.colorblockMarket}.purchase (read-msg "token") (read-msg "buyer") (read-msg "seller") (read-decimal "price") (read-decimal "amount"))`
    } else {
      // if buyer has no matched asset, then use purchase-new-account
      code = `(${contractModules.colorblockMarket}.purchase-new-account (read-msg "token") (read-msg "buyer") (read-msg "seller") (read-decimal "price") (read-decimal "amount") (read-keyset "buyerKeyset"))`
      preparedData.buyerKeyset = { 
        keys: [buyer],
        pred: 'keys-all'
      };
    }

    const paidToSeller = toPricePrecision(amount * price);
    const paidToPool = toPricePrecision(paidToSeller * marketConfig.fees);
    console.log(paidToSeller, paidToPool, marketConfig.fees);
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
      alert('purchase successfully');
      const newAssetId = result.data.assetId;
      document.location.href = `/asset/${newAssetId}`;
    } else {
      alert(result.data);
    }
  };

  useEffect(() => {
    const fetchAsset = async (assetId) => {
      const url = `${serverUrl}/asset/${assetId}`;
      const assetData = await fetch(url).then(res => res.json());
      assetData.url = `${serverUrl}/static/img/${assetData.item.id}.${assetData.item.type === 0 ? 'png' : 'gif'}`;
      assetData.dealOpen = assetData.deal ? assetData.deal.open : false;
      setItem(assetData);
    };

    fetchAsset(assetId);
  }, [assetId]);

  return (
    <div data-role='asset page'>
      <div data-role='asset info' className='flex my-10'>
      {
        asset &&
        <div className='w-1/3 border-r-2 flex flex-col items-center justify-center'>
          <p>Asset ID: {assetId}</p>
          <p>Item ID: {asset.item.id}</p>
          <p>Item title: {asset.item.title}</p>
          <p>{asset.item.tags ? `Item tags: ${asset.item.tags}` : ''}</p>
          <p>{asset.item.description ? `Item description: ${asset.item.description}` : ''}</p>
          <p>Item creator: <a href={`/user/${asset.item.creator}`}>{shortAddress(asset.item.creator)}</a></p>
          <p>Item owner: <a href={`/user/${asset.user_id}`}>{shortAddress(asset.user_id)}</a></p>
          <div className='my-3'>
            <img src={asset.url} className='w-40' alt={asset.item.title} />
          </div>
        </div>
      }
      </div>
      <div data-role='deal info' className='bg-white border-t-2 my-10 py-6'>
      {
        asset && asset.user_id === wallet.address && asset.dealOpen === false &&
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
        asset && asset.user_id === wallet.address && asset.dealOpen === true &&
        <div data-role='market board' className='flex flex-col space-y-2 items-center'>
          <p>Deal seller: {shortAddress(asset.deal.user_id)}</p>
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
        asset && asset.user_id !== wallet.address && asset.dealOpen === true &&
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
    </div>
  );
};

AssetPage.propTypes = {
};

const mapStateToProps = state => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetPage);
