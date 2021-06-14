import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import ItemList from '../common/ItemList';
import AssetList from '../common/AssetList';
import CollectionList from '../common/CollectionList';
import { serverUrl } from '../../config';
import { showLoading, hideLoading } from '../../store/actions/actionCreator';

export const MarketPage = (props) => {
  
  const { type } = useParams();
  const { loading, showLoading, hideLoading } = props;
  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchLatestData = async () => {
      showLoading();

      switch (type) {
        case 'items':
          await fetchLatestItems();
          break;
        case 'assets':
          await fetchLatestAssets();
          break;
        case 'collections':
          await fetchLatestCollections();
          break;
        default:
          break;
      }

      hideLoading();
    };

    const fetchLatestItems = async () => {
      const itemsUrl = `${serverUrl}/item/latest`;
      const itemsData = await fetch(itemsUrl).then(res => res.json());
      console.log(itemsData);
      setItems(itemsData);
    };

    const fetchLatestAssets = async () => {
      const assetsUrl = `${serverUrl}/asset/latest`;
      const assetsData = await fetch(assetsUrl).then(res => res.json());
      console.log(assetsData);
      setAssets(assetsData);
    };

    const fetchLatestCollections = async () => {
      const collectionsUrl = `${serverUrl}/collection/latest`;
      const collectionsData = await fetch(collectionsUrl).then(res => res.json());
      console.log(collectionsData);
      setCollections(collectionsData);
    };

    fetchLatestData();
  }, [type, showLoading, hideLoading]);

  return loading ? <></> : (
    <div data-role='market container' className='bg-cb-gray text-sm'>
      <div data-role='item filter and sort' className='w-5/6 mx-auto my-10 flex justify-between'>
        <div data-role='filter at left' className='flex space-x-4'>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200 cursor-pointer'>Animated</span>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200 cursor-pointer'>Image</span>
          <span className='py-1 px-6 flex items-center hover:bg-gray-200 cursor-pointer'>Collection</span>
        </div>
        <div data-role='sort at right' className='relative h-8'>
          <select className='h-full px-10 border rounded-xl mx-auto cursor-pointer'>
            <option className='text-center mx-auto'>Popular</option>
            <option className='text-center mx-auto'>Mint Time</option>
          </select>
          <div className='absolute top-0 left-2 mx-2 text-gray-300 h-full flex items-center'>
            <FontAwesomeIcon icon={fa.faCaretDown} />
          </div>
        </div>
      </div>
      {
        type === 'items' &&
        <div data-role='items list' className='w-5/6 mx-auto'>
          <ItemList items={items} display='grid' />
        </div>
      }
      {
        type === 'assets' &&
        <div data-role='assets list' className='w-5/6 mx-auto'>
          <AssetList assets={assets} display='grid' />
        </div>
      }
      {
        type === 'collections' &&
        <div data-role='collections list' className='w-5/6 mx-auto'>
          <CollectionList collections={collections} display='grid' />
        </div>
      }
    </div>
  );
};

MarketPage.propTypes = {
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(MarketPage);
