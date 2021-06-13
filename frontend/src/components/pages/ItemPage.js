import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

import { serverUrl } from '../../config';
import { shortAddress } from '../../utils/polish';
import AssetList from '../common/AssetList';
import { mkReq } from '../../utils/sign';

const ItemPage = (props) => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [itemLog, setItemLog] = useState(null);
  const [assets, setAssets] = useState(null);
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState(null);

  const assetListConfig = {
    type: 'item',
    flow: 'flex',
    cols: 5
  };

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
      const collections = await fetch(url).then(res => res.json());
      setCollections(collections);
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
    const selectedCollections = collections.filter(clt => clt.selected);
    const collectionId = selectedCollections.length > 0 ? selectedCollections[0].id : collections[0].id;
    const postData = {
      collectionId,
      itemId
    };
    const url = `${serverUrl}/collection/add_item`;
    const result = await fetch(url, mkReq(postData)).then(res => res.json());
    if (result.status === 'success') {
      toast.success('sync successfully');
    } else {
      toast.error(result.data);
    }
  };

  useEffect(() => {
    const fetchItem = async (itemId) => {
      const url = `${serverUrl}/item/${itemId}`;
      const itemData = await fetch(url).then(res => res.json());
      itemData.url = `${serverUrl}/static/img/${itemId}.${itemData.type === 0 ? 'png' : 'gif'}`;
      setItem(itemData);
    };

    const fetchItemLog = async (itemId) => {
      const url = `${serverUrl}/item/${itemId}/log`;
      const itemLog = await fetch(url).then(res => res.json());
      setItemLog(itemLog);
    };

    const fetchOnSaleAssets = async (itemId) => {
      const url = `${serverUrl}/asset/on_sale/${itemId}`;
      const assets = await fetch(url).then(res => res.json());
      setAssets(assets);
    };

    fetchItem(itemId);
    fetchItemLog(itemId);
    fetchOnSaleAssets(itemId);
  }, [itemId]);

  return (
    <div data-role='item page'>
      <div data-role='item info' className='flex my-10'>
      {
        item &&
        <div className='w-1/3 border-r-2 flex flex-col items-center justify-center'>
          <p>Item ID: {itemId}</p>
          <p>Item title: {item.title}</p>
          <p>{item.tags ? `Item tags: ${item.tags}` : ''}</p>
          <p>{item.description ? `Item description: ${item.description}` : ''}</p>
          <p>Item creator: <a href={`/user/${item.creator}`}>{shortAddress(item.creator)}</a></p>
          <div className='my-3'>
            <img src={item.url} className='w-40' alt={item.title} />
          </div>
          <button onClick={ () => clickCollection() } className='w-1/2 bg-gray-200 rounded py-1 px-2 my-4'>
            Add to collection
          </button>
          {
            showCollections &&
            <div data-role='collection select' className='relative w-1/2 h-8'>
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
            <button onClick={ () => addIntoCollection() } className='w-1/2 bg-gray-200 rounded py-1 px-2 my-4'>
              Confirm
            </button>
          }
        </div>
      }
      {
        itemLog &&
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
      <div data-role='asset info' className='mt-12 border-t-2 w-11/12 text-xs my-10'>
        <div data-role='info' className='w-full flex justify-between my-5 tracking-wider'>
          <div className='text-base'>
            Selling Assets
          </div>
          <div className='text-gray-400'>
            <a href='/market/assets'>View More</a>
          </div>
        </div>
        {
          assets &&
          <AssetList assets={assets} config={assetListConfig} />
        }
      </div>
    </div>
  )
};

ItemPage.propTypes = {
};

const mapStateToProps = state => ({
  wallet: state.wallet
});

const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(ItemPage);