import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fa from '@fortawesome/free-solid-svg-icons';

import ItemList from '../common/ItemList';
import UserList from '../common/UserList';
import { serverUrl } from '../../config';

export const SearchPage = (props) => {
  
  const { keyword } = useParams();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [tabType, setTabType] = useState('item');

  const itemListConfig = {
    type: 'item',
    flow: 'grid',
    cols: 5
  };
  const userListConfig = {
    type: 'item',
    flow: 'grid',
    cols: 5
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      const url = `${serverUrl}/search/${keyword}`;
      console.log(url);
      const data = await fetch(url).then(res => res.json());
      console.log(data);
      setItems(data.items);
      setUsers(data.users);
    };

    fetchSearchResults();
  }, [keyword]);

  return (
    <div data-role='market container' className='bg-cb-gray text-sm'>
      <div data-role='result tabs' className='mx-auto my-10 pb-3 flex justify-center space-x-20 text-lg border-b'>
        <button className='px-5 py-2 hover:bg-gray-300' onClick={ () => setTabType('item') }>Item({items.length})</button>
        <button className='px-5 py-2 hover:bg-gray-300' onClick={ () => setTabType('user') }>User({users.length})</button>
      </div>
      <div data-role='result presentaion'>
        {
          tabType === 'item' && (
            <div data-role='items container' className=''>
              {
                items.length > 0 ? <ItemList items={items} config={itemListConfig} /> : <>No items</>
              }
            </div>
          )
        }
        {
          tabType === 'user' && (
            <div data-role='users container' className=''>
              {
                users.length > 0 ? <UserList users={users} config={userListConfig} /> : <>No users</>
              }
            </div>
          )
        }
      </div>
    </div>
  );
};

SearchPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchPage);
