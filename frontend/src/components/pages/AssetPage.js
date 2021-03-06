import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useHistory } from 'react-router';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getSignedCmd, mkReq } from '../../utils/sign';
import { serverUrl, contractModules, marketConfig } from '../../config';
import { shortAddress } from '../../utils/polish';
import { toPricePrecision, toAmountPrecision } from '../../utils/tools';
import { showLoading, hideLoading, createBaseMsg } from '../../store/actions/actionCreator';
import * as types from '../../store/actions/actionTypes';

const AssetPage = (props) => {
  const { assetId } = useParams();
  const routerHistory = useHistory();
  const { wallet, loading, showLoading, hideLoading } = props;
  const [asset, setItem] = useState(null);
  const [releaseData, setReleaseData] = useState({
    price: null,
    amount: null
  });
  const [purchaseAmount, setPurchaseAmount] = useState(null);

  const createSale = async () => {
    const postData = {
      item_id: asset.item.id,
      public_key: wallet.address,
      amount: 2
    };
    const result = await fetch(`${serverUrl}/sale/create/build`, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    console.log('get result', result);
    if (result) {
      toast.success('build successfully');
      const cmd = result.data;
      const signedCmd = await getSignedCmd(cmd);
      console.log(signedCmd);
    }
  };

  const onRelease = async () => {
    if (!releaseData.price) {
      toast.error('Please enter correct price');
      return;
    }
    const price = toPricePrecision(releaseData.price);
    if (price <= 0) {
      toast.error(`Please enter correct price`);
      return;
    }
    if (!releaseData.amount) {
      toast.error('Please enter correct amount');
      return;
    }
    const amount = toAmountPrecision(releaseData.amount);
    if (amount !== releaseData.amount) {
      toast.error(`Amount is expected as an integer`);
      return;
    }
    if (amount <= 0) {
      toast.error(`Please enter correct amount`);
      return;
    } else if (amount > asset.balance) {
      toast.error(`Release amount must not exceed balance ${asset.balance}`);
      return;
    }
    
    // post release request
    const envData = {
      id: asset.item.id,
      price,
      amount
    };
    const postData = {
      envData
    };
    const addition = {
    };

    const url = `${serverUrl}/asset/release/prepare`;
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (result && result.status === 'success') {
      const msg = createBaseMsg();
      window.postMessage({
        ...msg,
        ...result.data,
        addition,
        walletIndex: 0,
        action: types.SIGN_CMD,
        context: 'assetPage',
        scene: 'release',
      });
      showLoading('Please confirm in Colorful Wallet...');
      return;
    }

    hideLoading();
  };

  const onRecall = async () => {
    // post recall request
    const itemId = asset.item.id;
    const seller = wallet.address;
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

    showLoading();

    const result = await fetch(`${serverUrl}/asset/recall`, signedCmd)
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    console.log('get result', result);
    if (result) {
      if (result.status === 'success') {
        toast.success('release successfully');
        routerHistory.push('/tmp');
        routerHistory.goBack();
      } else {
        toast.error(result.data);
      }
    }

    hideLoading();
  };

  const onPurchase = async () => {
    // post recall request
    const itemId = asset.item.id;
    const buyer = wallet.address;
    const seller = asset.sale.user_id;

    const price = toPricePrecision(asset.sale.price);

    if (!purchaseAmount) {
      toast.error('Please enter correct purchase amount');
      return;
    }
    const amount = toAmountPrecision(purchaseAmount);
    if (amount !== purchaseAmount) {
      toast.error(`Purchase amount is expected as an integer`);
      return;
    }
    if (amount <= 0) {
      toast.error(`Please enter correct purchase amount`);
      return;
    } else if (amount > asset.sale.remain) {
      toast.error(`Purchase amount must not exceed sale's remained amount`);
      return;
    }

    const ownershipResult = await fetch(`${serverUrl}/item/${itemId}/is-owned-by/${buyer}`)
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });
    
    if (!ownershipResult) {
      return;
    }

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
    const paidTotal = paidToSeller + paidToPool;

    // check balance
    const balanceResult = await fetch(`${serverUrl}/user/kda-balance`, mkReq())
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (!balanceResult) {
      return;
    }
    const balance = balanceResult.data;
    if (balance < paidTotal) {
      toast.error('KDA balance is not sufficient for purchase');
      return;
    }

    console.log(paidToSeller, paidToPool, marketConfig.fees, balance);
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

    showLoading();

    const result = await fetch(`${serverUrl}/asset/purchase`, signedCmd)
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    console.log('get result', result);
    if (result) {
      if (result.status === 'success') {
        toast.success('purchase successfully');
        const newAssetId = result.data.assetId;
        const newUrl = `/asset/${newAssetId}`;
        routerHistory.push(newUrl);
      } else {
        toast.error(result.data);
      }
    }

    hideLoading();
  };

  useEffect(() => {
    const fetchAsset = async (assetId) => {
      showLoading();

      const url = `${serverUrl}/asset/${assetId}`;
      const assetData = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (assetData) {
        assetData.url = `${serverUrl}/static/img/${assetData.item.id}.${assetData.item.type === 0 ? 'png' : 'gif'}`;
        assetData.saleOpen = assetData.sale ? assetData.sale.open : false;
        setItem(assetData);
      }

      hideLoading();
    };


    fetchAsset(assetId);
  }, [assetId, showLoading, hideLoading]);

  return loading ? <></> : (
    <div data-role='asset page'>
      <div data-role='asset info' className='flex my-10 pb-20'>
      {
        asset &&
        <div className='w-1/3 border-r-2 flex flex-col items-center justify-center'>
          <div className='border rounded'>
            <p></p>
          </div>
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
      <div data-role='sale info' className='bg-white border-t-2 my-10 py-6'>
      {
        asset && asset.user_id === wallet.address && asset.saleOpen === false &&
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
          
          <button
            className='px-3 py-2 bg-cb-pink text-white'
            onClick={ () => createSale() }
          >
            Create sale
          </button>
        </div>
      }
      {
        asset && asset.user_id === wallet.address && asset.saleOpen === true &&
        <div data-role='market board' className='flex flex-col space-y-2 items-center'>
          <p>Sale seller: {shortAddress(asset.sale.user_id)}</p>
          <p>Sale price: {asset.sale.price}</p>
          <p>Sale total amount: {asset.sale.total}</p>
          <p>Sale remain amount: {asset.sale.remain}</p>
          <button
            className='px-3 py-2 bg-cb-pink text-white'
            onClick={ () => onRecall() }
          >
            Recall
          </button>
        </div>
      }
      {
        asset && asset.user_id !== wallet.address && asset.saleOpen === true &&
        <div data-role='market board' className='flex flex-col space-y-3 items-center'>
          <p>Sale seller: {asset.sale.user_id}</p>
          <p>Sale price: {asset.sale.price}</p>
          <p>Sale total amount: {asset.sale.total}</p>
          <p>Sale remain amount: {asset.sale.remain}</p>
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
  wallet: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  wallet: state.wallet,
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  showLoading: (text=null) => dispatch(showLoading(text)),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetPage);
