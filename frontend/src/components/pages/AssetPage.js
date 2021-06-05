import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { serverUrl } from '../../config';

const AssetPage = (props) => {
  const { assetId } = useParams();
  const [asset, setItem] = useState(null);

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
      <p>Item ID: {assetId}</p>
      <p>Item title: {asset.item.title}</p>
      <p>Item tags: {asset.item.tags}</p>
      <p>Item description: {asset.item.description}</p>
      <p>Item creator: <a href={`/user/${asset.item.creator}`}>{asset.item.creator}</a></p>
      <div>
        <img src={asset.url} className='w-40' alt={asset.title} />
      </div>
    </div>
  ) : <></>;
};

export default AssetPage;
