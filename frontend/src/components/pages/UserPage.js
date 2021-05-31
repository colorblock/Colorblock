import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { shortAddress } from '../../utils/polish';
import { withCors } from '../../utils/sign';
import ItemList from '../common/ItemList';
import { serverUrl } from '../../config';

const UserPage = (props) => {
  console.log(useParams());
  const { userId } = useParams();
  console.log(userId);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  const itemListConfig = {
    type: 'item',
    flow: 'grid',
    cols: 5
  };

  useEffect(() => {
    const fetchUser = async (userId) => {
      let userData;
      if (userId) {
        const url = `${serverUrl}/user/${userId}`;
        userData = await fetch(url).then(res => res.json());
      } else {
        const url = `${serverUrl}/user`;
        userData = await fetch(url, withCors).then(res => res.json());
        if (userData.status === 'error') {
          alert(userData.message);
          window.history.back();
          return;
        }
      }
      userData.avatar = userData.avatar || '/img/colorblock_logo.svg';
      userData.uname = userData.uname || shortAddress(userData.address);
      setUser(userData);

      // fetch items
      const itemsUrl = `${serverUrl}/item/created-by/${userId}`;
      const itemsData = await fetch(itemsUrl).then(res => res.json());
      console.log(itemsData);
      setItems(itemsData);
    };

    fetchUser(userId);
  }, [userId]);

  return user ? (
    <div>
      <div data-role='user info' className='my-8 flex flex-col items-center justify-center'>
        <img 
          src={user.avatar} 
          className='w-12 border rounded-full m-4'
          alt={user.uname}
        />
        <p>{user.uname}</p>
        <p className='py-2 text-xs text-gray-400'>{user.address}</p>
      </div>
      {
        items.length > 0 ? (
          <div data-role='item list'>
            <ItemList items={items} config={itemListConfig} />
          </div>
        ) : (
          <div>
            No items
          </div>
        )
      }
    </div>
  ) : <></>;
};

export default UserPage;
