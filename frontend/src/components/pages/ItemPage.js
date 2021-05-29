import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { serverUrl } from '../../config';

const ItemPage = (props) => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const fetchItem = async (itemId) => {
      const url = `${serverUrl}/item/${itemId}`;
      const itemData = await fetch(url).then(res => res.json());
      itemData.url = `${serverUrl}/static/img/${itemId}.${itemData.type === 0 ? 'png' : 'gif'}`;
      setItem(itemData);
    };

    fetchItem(itemId);
  }, [itemId]);

  return item ? (
    <div>
      <p>Item ID: {itemId}</p>
      <p>Item title: {item.title}</p>
      <p>Item tags: {item.tags}</p>
      <p>Item description: {item.description}</p>
      <p>Item creator: <a href={`/user/${item.creator}`}>{item.creator}</a></p>
      <p>Item txID: {item.tx_id}</p>
      <div>
        <img src={item.url} className='w-40' alt={item.title} />
      </div>
    </div>
  ) : <></>;
};

export default ItemPage;
