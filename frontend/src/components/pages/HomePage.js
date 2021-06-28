import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import CollectionList from '../common/CollectionList';
import ItemList from '../common/ItemList';
import AssetList from '../common/AssetList';
import { serverUrl } from '../../config';
import { showLoading, hideLoading } from '../../store/actions/actionCreator';

const HomePage = (props) => {

  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [collections, setCollections] = useState([]);
  const [latestHeight, setLatestHeight] = useState(null);

  const { loading, showLoading, hideLoading } = props;

  useEffect(() => {
    const initPage = async () => {
      showLoading();

      await Promise.all([
        fetchLatestItems(),
        fetchLatestAssets(),
        fetchLatestCollections(),
        fetchLatestHeight()
      ]);

      hideLoading();
    };

    const fetchLatestItems = async () => {
      const itemsUrl = `${serverUrl}/item/latest`;
      const itemsData = await fetch(itemsUrl)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      console.log(itemsData);
      if (itemsData) {
        setItems(itemsData);
      }
    };

    const fetchLatestAssets = async () => {
      const assetsUrl = `${serverUrl}/asset/latest`;
      const assetsData = await fetch(assetsUrl)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      console.log(assetsData);
      if (assetsData) {
        setAssets(assetsData);
      }
    };

    const fetchLatestCollections = async () => {
      const collectionsUrl = `${serverUrl}/collection/latest`;
      const collectionsData = await fetch(collectionsUrl)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      console.log(collectionsData);
      if (collectionsData) {
        setCollections(collectionsData);
      }
    };

    const fetchLatestHeight = async () => {
      const url = `${serverUrl}/tool/latest_height`;
      const data = await fetch(url)
        .then(res => res.json())
        .catch(error => {
          console.log(error);
          toast.error(error.message);
        });

      if (data) {
        setLatestHeight(data.height);
      }
    };
    
    initPage();
  }, [showLoading, hideLoading]);

  return loading ? <></> : (
    <div data-role='home container' className='bg-cb-gray text-sm'>
      <div 
        data-role='top banner' 
        className='relative pt-20 h-60 mb-20'
        style={{ 
          backgroundImage: "url('/img/banner_left.svg'), url('/img/banner_right.svg')",
          backgroundPosition: "top 50px left, top 50px right",
          backgroundSize: "25%, 25%",
          backgroundRepeat: "no-repeat, no-repeat"
        }}
      >
        { latestHeight && 
          <span data-role='block height' className='absolute top-3 right-6 text-xs text-gray-400'>
            {latestHeight}
          </span>
        }
        { latestHeight && 
          <span data-role='block height' className='absolute top-3 left-6 text-xs text-gray-400'>
            {latestHeight-1}
          </span>
        }
        <div data-role='top banner title' className='text-center'>
          <p className='tracking-wider text-lg font-medium'>On-chain Pixel NFTs on <span className='text-cb-pink font-bold'>Kadena</span></p>
          <p className='my-6 leading-6'>Explore, Mint or Create your own pixel non fungible tokens<br />with ColorBlock</p>
          <div className='flex justify-center space-x-6'>
            <a href='/create'><button className='px-7 py-2 text-white bg-cb-pink border rounded-lg shadow'>Create</button></a>
            <a href='/market/items'><button className='px-7 py-2 bg-white border border-gray-300 rounded-lg shadow'>Market</button></a>
          </div>
        </div>
      </div>
      <div data-role='featured collections' className='w-5/6 mx-auto mt-32 mb-12'>
        <div data-role='info' className='flex justify-between my-5 tracking-wider'>
          <div className='text-base'>
            Featured Collections
            <span className='ml-5 text-cb-pink text-sm'>Get Featured</span>
          </div>
          <a className='text-gray-400' href='/market/collections'>
            View More
          </a>
        </div>
        <CollectionList collections={collections} display='flex' />
      </div>
      <div data-role='trending' className='w-5/6 mx-auto my-12'>
        <div data-role='info' className='flex justify-between my-5 tracking-wider'>
          <div className='text-base'>
            Trending
          </div>
          <a className='text-gray-400' href='/market/assets'>
            View More
          </a>
        </div>
        <AssetList assets={assets} display='flex' />
      </div>
      {
        items.length > 0 &&
        <div data-role='recently minted' className='w-5/6 mx-auto my-12'>
          <div data-role='info' className='flex justify-between my-5 tracking-wider'>
            <div className='text-base'>
              Recently Minted
            </div>
            <a className='text-gray-400' href='/market/items'>
              View More
            </a>
          </div>
          <ItemList items={items} display='flex' />
        </div>
      }
      <div data-role='view more' className='w-5/6 mx-auto my-20'>
        <a href='/market/items'><button className='w-full py-3 border rounded-xl shadow hover-gray'>View More</button></a>
      </div>
      <div data-role='project highlight' className='w-5/6 mx-auto mt-8 flex justify-center text-center border-t pt-24'>
        <div className='w-1/3 px-10 leading-6 flex flex-col items-center'>
          <img src='/img/on_chain_icon.svg' className='w-10 mb-5' alt='on chain' />
          <p className='font-bold text-cb-pink mb-6 text-lg'>On-Chain</p>
          <p>All artwork associated with each NFT is stored and located on chain. All NFTs are deployed onto Kadena's braided multi-chain proof of work network.</p>
        </div>
        <div className='w-1/3 px-10 leading-6 flex flex-col items-center'>
          <img src='/img/no_fee_mint_icon.svg' className='w-10 mb-5' alt='no fee' />
          <p className='font-bold text-cb-pink mb-6 text-lg'>No Fees</p>
          <p>Kadena's Gas Station feature allows ColorBlock to subsidize gas fees for users allowing for feeless minting! Never has it been easier to get started with NFTs on ColorBlock.</p>
        </div>
        <div className='w-1/3 px-10 leading-6 flex flex-col items-center'>
          <img src='/img/polyfungibility_icon.svg' className='w-10 mb-5' alt='polyfungibility' />
          <p className='font-bold text-cb-pink mb-6 text-lg'>Polyfungible</p>
          <p>ColorBlock adopts KIP-0011, giving users the option of fractional ownership and custody of NFTs. Customize your NFT in our Creator!</p>
        </div>
      </div>
      <div hidden>TODO: Learn more</div>
      <div data-role='creator introduction' className='w-5/6 mx-auto flex justify-between mt-10 mb-28'>
        <div className='w-2/3 flex flex-col pt-20'>
          <p className='text-lg font-bold text-cb-pink py-10'>Create your NFTs in Colorblock Creator</p>
          <p>Get started with NFTs on Colorblock by designing your own in Colorblock Creator. Use</p>
          <p> Colorblock's suite of tools to design and deploy with no fees!</p>
          <button className='w-40 py-2 my-10 bg-cb-pink border rounded-lg border-white text-white'>Get Started</button>
        </div>
        <div className='w-1/3'>
          <img src='/img/banner_right.png' className='w-96' alt='banner right' />
        </div>
      </div>
    </div>
  );
};

HomePage.propTypes = {
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading,
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);

