import React, { useState, useEffect } from 'react';
import CollectionList from '../common/CollectionList';
import ItemList from '../common/ItemList';
import AssetList from '../common/AssetList';
import { serverUrl } from '../../config';

const HomePage = (props) => {

  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [collections, setCollections] = useState([]);
  const [latestHeight, setLatestHeight] = useState(null);

  useEffect(() => {
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

    const fetchLatestHeight = async () => {
      const url = `${serverUrl}/tool/latest_height`;
      const data = await fetch(url).then(res => res.json());
      setLatestHeight(data.height);
    };

    fetchLatestItems();
    fetchLatestAssets();
    fetchLatestCollections();
    fetchLatestHeight();
  }, []);

  return (
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
        <span data-role='block height' className='absolute top-3 right-6 text-xs text-gray-400'>
          {latestHeight}
        </span>
        <span data-role='block height' className='absolute top-3 left-6 text-xs text-gray-400'>
          {latestHeight-1}
        </span>
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
      <div data-role='project highlight' className='w-5/6 mx-auto mt-40 flex justify-center text-center'>
        <div className='w-1/3 px-10 leading-6'>
          <p className='font-bold text-cb-pink mb-6 text-lg'>On-Chain</p>
          <p>All artwork associated with each NFT is stored and located on chain. All NFTs are deployed onto Kadena's braided multi-chain proof of work network.</p>
        </div>
        <div className='w-1/3 px-10 leading-6'>
          <p className='font-bold text-cb-pink mb-6 text-lg'>No Fees</p>
          <p>Kadena's Gas Station feature allows ColorBlock to subsidize gas fees for users allowing for feeless minting! Never has it been easier to get started with NFTs on ColorBlock.</p>
        </div>
        <div className='w-1/3 px-10 leading-6'>
          <p className='font-bold text-cb-pink mb-6 text-lg'>Polyfungible</p>
          <p>ColorBlock adopts KIP-0011, giving users the option of fractional ownership and custody of NFTs. Customize your NFT in our Creator!</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
