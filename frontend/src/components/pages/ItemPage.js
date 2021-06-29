import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import { serverUrl } from '../../config';
import { shortAddress } from '../../utils/polish';
import { mkReq } from '../../utils/sign';
import { showLoading, hideLoading, createBaseMsg } from '../../store/actions/actionCreator';
import * as types from '../../store/actions/actionTypes';
import { firstUrl, secondUrl, toAmountPrecision, toPricePrecision } from '../../utils/tools';

const ItemPage = (props) => {
  const { itemId } = useParams();
  const { loading, showLoading, hideLoading } = props;
  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [itemLog, setItemLog] = useState(null);
  const [assets, setAssets] = useState(null);
  const [sales, setSales] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selfAsset, setSelfAsset] = useState(null);
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState(null);
  const [showItemLog, setShowItemLog] = useState(false);
  const [showManageAsset, setShowManageAsset] = useState(false);
  const [newSaleData, setNewSaleData] = useState(false);
  const [purchaseData, setPurchaseData] = useState(false);

  const history = useHistory();

  const getBlockInfo = (data) => {
    return (
      <div className='w-full text-left'>
        <p>Block height: {data.block_height}</p>
        <p>Block hash: {data.block_hash}</p>
        <p>Block time: {data.block_time}</p>
        <p>Tx ID: {data.tx_id}</p>
        <p>Tx hash: {data.tx_hash}</p>
        <p>Tx status: {data.tx_status}</p>
      </div>
    );
  };

  const { wallet } = props;
  const fetchCollections = async () => {
    if (wallet.address) {
      const url = `${serverUrl}/collection/owned-by/${wallet.address}`;
      const collections = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (collections) {
        setCollections(collections);
      }
    }
  };

  const getCollectionTitle = () => {
    const selectedTitles = collections.filter(clt => clt.selected === true).map(clt => clt.title);
    return selectedTitles.length > 0 ? selectedTitles[0] : 'No Collection';
  };

  const clickCollection = async () => {
    if (!showCollections) {
      await fetchCollections();
    }
    setShowCollections(!showCollections);
  };

  const addIntoCollection = async () => {
    if (collections.length === 0) {
      toast.warning('Please create collection first')
      return;
    }
    const selectedCollections = collections.filter(clt => clt.selected);
    const collectionId = selectedCollections.length > 0 ? selectedCollections[0].id : collections[0].id;
    const postData = {
      collectionId,
      itemId
    };
    const url = `${serverUrl}/collection/add_item`;
    const result = await fetch(url, mkReq(postData))
      .then(res => res.json())
      .catch(error => {
        console.log(error);
        toast.error(error.message);
      });

    if (result) {
      if (result.status === 'success') {
        toast.success('sync successfully');
      } else {
        toast.error(result.data);
      }
    }
  };  
  
  const onCreateSale = async () => {
    const asset = selfAsset;
    if (!newSaleData.price) {
      toast.error('Please enter correct price');
      return;
    }
    const price = toPricePrecision(newSaleData.price);
    if (price <= 0) {
      toast.error(`Please enter correct price`);
      return;
    }
    if (!newSaleData.amount) {
      toast.error('Please enter correct amount');
      return;
    }
    const amount = toAmountPrecision(newSaleData.amount);
    if (amount !== newSaleData.amount) {
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
      id: itemId,
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

  
  const onCancelSale = async () => {
    const asset = selfAsset;
    
    const envData = {
      id: itemId,
      amount: parseFloat(asset.sale.remaining)
    };
    const postData = {
      envData
    };
    const addition = {
    };

    const url = `${serverUrl}/asset/recall/prepare`;
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
        scene: 'recall',
      });
      showLoading('Please confirm in Colorful Wallet...');
      return;
    }
    
    hideLoading();
  };
  
  const onPurchase = async () => {
    const asset = selfAsset;
    const price = selectedSale.price;
    if (!purchaseData.amount) {
      toast.error('Please enter correct amount');
      return;
    }
    const amount = toAmountPrecision(purchaseData.amount);
    if (amount !== purchaseData.amount) {
      toast.error(`Amount is expected as an integer`);
      return;
    }
    if (amount <= 0) {
      toast.error(`Please enter correct amount`);
      return;
    } else if (amount > selectedSale.remaining) {
      toast.error(`Release amount must not exceed remaining amount ${selectedSale.remaining}`);
      return;
    }
    
    const envData = {
      id: itemId,
      amount
    };
    const postData = {
      envData
    };
    const addition = {
    };

    const url = `${serverUrl}/asset/purchase/prepare`;
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
        scene: 'purchase',
      });
      showLoading('Please confirm in Colorful Wallet...');
      return;
    }
    
    hideLoading();
  };

  useEffect(() => {
    const fetchData = async (itemId) => {
      showLoading();

      await Promise.all([
        fetchItem(itemId),
        fetchItemLog(itemId),
        fetchOnSaleAssets(itemId),
        fetchItemCollection(itemId)
      ]);

      hideLoading();
    };

    const fetchItem = async (itemId) => {
      const url = `${serverUrl}/item/${itemId}`;
      const itemData = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (itemData) {
        itemData.url = `${serverUrl}/static/img/${itemId}.${itemData.type === 0 ? 'png' : 'gif'}`;
        setItem(itemData);
      }
    };

    const fetchItemLog = async (itemId) => {
      const url = `${serverUrl}/item/${itemId}/log`;
      const itemLog = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (itemLog) {
        setItemLog(itemLog);
      }
    };

    const fetchOnSaleAssets = async (itemId) => {
      const url = `${serverUrl}/asset/of-item/${itemId}`;
      const assets = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (assets) {
        setAssets(assets);
        const sales = assets.filter(asset => asset.sale && asset.sale.status == 'open').map(asset => asset.sale);
        setSales(sales);
        const selfAssets = assets.filter(asset => asset.user_id === wallet.address);
        setSelfAsset(selfAssets.length > 0 ? selfAssets[0] : null);
        if (sales.length > 0) {
          setSelectedSale(sales[0]);
        }
      }
    };

    const fetchItemCollection = async (itemId) => {
      const url = `${serverUrl}/collection/of-item/${itemId}`;
      const collection = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if ( collections) {
        console.log(collection);
      }
    };

    const setupWindow = () => {
      window.addEventListener('message', handleMessage);
    };
    const handleMessage = (event) => {
      const data = event.data;
      const source = data.source || '';
      if (source.startsWith('colorful') && data.context === 'assetPage') {
        if (data.action === types.SIGN_CMD && data.scene === 'release') {
          if (data.status === 'success') {
            console.log('in release success', data);
            const signedCmd = {
              hash: data.hash,
              cmd: data.cmd,
              sigs: data.sigs.concat(data.data.sigs)
            };
            showLoading('Uploading transaction to Chainweb, please wait 30 ~ 90 seconds');
            const postData = {
              ...data.addition,
              signedCmd
            };
            const originPath = history.location.pathname;
            const url = `${serverUrl}/asset/release`;
            fetch(url, mkReq(postData))
              .then(res => res.json())
              .then(data => {
                hideLoading();
                if (data.status === 'success') {
                  toast.success('Release successfully');
                  history.push('/tmp');
                  history.push('/originPath');
                } else {
                  toast.error(data.data);
                }
              })
              .catch(error => {
                console.log(error);
                toast.error(error.message);
              });
          }
        } else if (data.action === types.SIGN_CMD && data.scene === 'recall') {
          if (data.status === 'success') {
            console.log('in recall success', data);
            const signedCmd = {
              hash: data.hash,
              cmd: data.cmd,
              sigs: data.sigs.concat(data.data.sigs)
            };
            showLoading('Uploading transaction to Chainweb, please wait 30 ~ 90 seconds');
            const postData = {
              ...data.addition,
              signedCmd
            };
            const originPath = history.location.pathname;
            const url = `${serverUrl}/asset/recall`;
            fetch(url, mkReq(postData))
              .then(res => res.json())
              .then(data => {
                hideLoading();
                if (data.status === 'success') {
                  toast.success('Recall successfully');
                  history.push('/tmp');
                  history.push('/originPath');
                } else {
                  toast.error(data.data);
                }
              })
              .catch(error => {
                console.log(error);
                toast.error(error.message);
              });
          }
        } else if (data.action === types.SIGN_CMD && data.scene === 'purchase') {
          if (data.status === 'success') {
            console.log('in purchase success', data);
            const signedCmd = {
              hash: data.hash,
              cmd: data.cmd,
              sigs: data.sigs.concat(data.data.sigs)
            };
            showLoading('Uploading transaction to Chainweb, please wait 30 ~ 90 seconds');
            const postData = {
              ...data.addition,
              signedCmd
            };
            const originPath = history.location.pathname;
            const url = `${serverUrl}/asset/purchase`;
            fetch(url, mkReq(postData))
              .then(res => res.json())
              .then(data => {
                hideLoading();
                if (data.status === 'success') {
                  toast.success('Purchase successfully');
                  history.push('/tmp');
                  history.push('/originPath');
                } else {
                  toast.error(data.data);
                }
              })
              .catch(error => {
                console.log(error);
                toast.error(error.message);
              });
          }
        }
      }
    };

    fetchData(itemId);
    setupWindow();
    
    return () => {
      // Unbind the event listener on clean up
      window.removeEventListener('message', handleMessage);
    };
  }, [itemId, showLoading, hideLoading]);

  return loading ? <></> : (
    <div data-role='item page'>
      <div className='flex my-10 w-10/12 mx-auto justify-between'>
      {
        item &&
        <div data-role='item info' className='w-60 flex flex-col items-center justify-center'>
          <div className='w-full p-4 border rounded-lg'>
            <p className='text-gray-500'>{item.collection || 'Default Collection'}</p>
            <p className='mt-1 mb-3'>{item.title}<span className='rounded-2xl border border-pink-500 text-pink-500 px-2 ml-3 text-xs'>{item.supply > 1 && 'Polyfungible'}</span></p>
            <img 
              src={firstUrl(item.urls)} 
              onError={ (e) => {
                e.target.onerror = null; 
                e.target.src = secondUrl(item.urls);
              } } 
              className='w-full' 
              alt='img thumbnail' 
            />
          </div>
          <div className='w-full p-4 border rounded-lg mt-4'>
            <p>Description:</p>
            <p className='text-gray-500 text-sm'>{item.description}</p>
          </div>
          <div className='w-full p-4 border rounded-lg mt-4'>
            <p>Creator: <span className='text-gray-500 text-sm italic'>{shortAddress(item.creator)}</span></p>
            <p>Item ID: <span className='text-gray-500 text-sm'>{item.id}</span></p>
          </div>
          <button onClick={ () => clickCollection() } className='w-full bg-gray-200 rounded py-1 px-2 my-4'>
            Add to collection
          </button>
          {
            showCollections &&
            <div data-role='collection select' className='relative w-full h-8'>
              <select 
                className='w-full h-full px-10 border rounded-lg cursor-pointer'
                onChange={(e) => setCollections(collections.map((clt, index) => index === e.target.selectedIndex ? {
                    ...clt,
                    selected: true
                  } : {
                    ...clt,
                    selected: false
                  }
                ))}
              >
                {
                  collections.length > 0 ?
                  collections.map(collection => (
                    <option 
                      className='text-center mx-auto'
                      selected={collection.selected === true}
                      key={collection.id}
                    >
                      {collection.title}
                    </option>
                  )) :
                  <option className='text-center mx-auto'>{getCollectionTitle()}</option>
                }
              </select>
              <div className='absolute top-0 right-6 mx-2 text-gray-300 h-full flex items-center'>
                <FontAwesomeIcon icon={fa.faCaretDown} />
              </div>
            </div>
          }
          {
            showCollections &&
            <button onClick={ () => addIntoCollection() } className='w-full bg-gray-200 rounded py-1 px-2 my-4'>
              Confirm
            </button>
          }
        </div>
      }
      {
        assets &&
        <div data-role='sale info' className='w-5/12 ml-10'>
          {
            sales.length > 0 ? 
            <div>
              <div className='font-bold mb-5'>Open Sell List({sales.length})</div>
              <div className='flex justify-between px-5 text-gray-500'>
                <span className='w-20 text-center'>Seller</span>
                <span className='w-20 text-center'>Amount</span>
                <span className='w-20 text-center'>Price</span>
              </div>
              {
                sales.map(sale => (
                  <div 
                    className='flex justify-between px-5 text-center py-3 border rounded-xl' 
                    onClick={ () => setSelectedSale(sale) }
                  >
                    <span className='w-20 text-center text-gray-500'>{sale.user_id}</span>
                    <span className='w-20 text-center'>{sale.remaining}</span>
                    <span className='w-20 text-center text-gray-500'>{sale.price} KDA</span>
                  </div>
                ))
              }
            </div> :
            <div className='font-bold mb-5'>No open sale</div>
          }
        </div>
      }
      <div className='ml-10 w-60'>
        <div className='w-full p-4 border rounded-lg'>
          {
            sales && selectedSale ? 
            <div>
              <p className='text-right text-sm'>Asset ID: <span className='text-gray-500 text-xs'>{assets.filter(v => v.sale && v.sale.id == selectedSale.id)[0].id}</span></p>
              <p className='text-right text-sm'>Seller: <span className='text-gray-500 text-xs'>{selectedSale.user_id}</span></p>
              <p className='text-right text-xl font-medium my-4 px-2'>{selectedSale.price} KDA</p>
              <div data-role='self sale'>
                <p className='text-gray-500 text-sm mt-3 mb-2'>{selectedSale.total} total {selectedSale.remaining} remained</p>
                <input 
                  className='w-full px-3 py-1 border rounded text-sm' placeholder='Quantity' 
                  onChange={ (e) => setPurchaseData({...purchaseData, amount: parseFloat(e.target.value) }) } 
                />
                <button 
                  className={`w-full py-1 border rounded-lg text-white mt-5 ${selectedSale.user_id === wallet.address ? 'bg-gray-700 cursor-not-allowed' : 'bg-cb-pink'}`}
                  disabled={selectedSale.user_id === wallet.address}
                  onClick={ () => onPurchase() }
                >
                  Buy
                </button>
              </div>
            </div> :
            <div>
              There're no sales yet
            </div>
          }
        </div>
        <button 
          className='w-full px-4 py-1 rounded bg-gray-300 my-10' 
          onClick={ () => setShowManageAsset(!showManageAsset) }
        >
          Manage My Asset +
        </button>
        {
          showManageAsset && selfAsset && (
            <div className='w-full p-4 border rounded-lg'>
            {
              selfAsset && selfAsset.sale && selfAsset.sale.status === 'open' ? (
                <div>
                  <p>Sale status: {selfAsset.sale.status}</p>
                  <p className='text-gray-500 text-sm mt-3 mb-2'>{selectedSale.total} total {selectedSale.remaining} remained</p>
                  <button className='w-full py-1 bg-cb-pink border rounded-lg text-white mt-5' onClick={ () => onCancelSale() }>
                    Cancel Sale
                  </button>
                </div>
              ) : (
                <div className='text-center'>
                  <p>Create a new sale</p>
                  <p className='text-gray-500 text-sm mt-3 mb-2'>{selfAsset.balance} available</p>
                  <input 
                    className='w-full px-3 py-1 border rounded text-sm' placeholder='Quantity'
                    type='number' 
                    onChange={ (e) => setNewSaleData({...newSaleData, amount: parseFloat(e.target.value) }) }  
                  />
                  <input 
                    className='w-full px-3 py-1 border rounded text-sm mt-3' placeholder='Price'
                    type='number' 
                    onChange={ (e) => setNewSaleData({...newSaleData, price: parseFloat(e.target.value) }) } 
                  />
                  <button className='w-full py-1 bg-cb-pink border rounded text-white mt-5' onClick={ () => onCreateSale() }>
                    Create Sale
                  </button>
                </div>
              )
            }
            </div>
          )
        }
      </div>
      {
        itemLog && showItemLog &&
        <div className='w-2/3 flex flex-col items-center justify-center px-20'>
          {
            itemLog.mint && 
            <div>
              <p className='border-b text-left font-semibold mt-3 pb-1 mb-2'>Mint</p>
              {getBlockInfo(itemLog.mint)}
            </div>
          }  {
            itemLog.purchases.length > 0 && 
            <div>
              <p className='border-b text-left font-semibold mt-3 pb-1 mb-2'>Purchase</p>
              {getBlockInfo(itemLog.purchases[0])}
            </div>
          }
        </div>
      }
      </div>
    </div>
  )
};

ItemPage.propTypes = {
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

export default connect(mapStateToProps, mapDispatchToProps)(ItemPage);
