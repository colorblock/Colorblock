import React from 'react';
import PropTypes from 'prop-types';
import { serverUrl } from '../../config';

const UserList = (props) => {

  const { users, display } = props;
  const flow = display === 'flex' ? 'flex overflow-x-auto space-x-4' : `grid grid-cols-5 gap-x-4 gap-y-10`;
  const width = display === 'flex' ? `w-1/5 my-2 mx-1` : '';

  return (
    <div>
      <ul data-role='blocks' className={`${flow} justify-between text-xs`}>
        {
          users.map((user) => (
            <li 
              data-role='block container' 
              className={`${width} h-56 flex-none px-4 py-4 cursor-pointer border rounded-xl border-gray-300 hover-gray`}
              onClick={ () => document.location.href = `/user/${user.id}` }
              key={user.id}
            >
              <div data-role='title and collection' className='h-8'>
                <p>{user.title}</p>
                <p className='text-gray-400'>{user.collection}</p>
              </div>
              <div data-role='thumbnail' className='h-32 py-6 flex justify-center'>
                <img className='h-full' src={`${serverUrl}/static/img/${user.id}.${user.avatar === 0 ? 'png' : 'gif'}`} alt={user.uname} />
              </div>
              <div data-role='creator and price' className='h-8 flex users-end justify-between'>
                <div>
                  <p className='text-xxs text-gray-500'>Creator</p>
                  <p>{`${user.address.slice(0, 4)}....${user.address.slice(-4)}`}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xxs-r text-gray-500'>Balance</p>
                  <p className='text-cb-pink'>{user.balance}</p>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
};

UserList.propTypes = {
  users: PropTypes.array.isRequired,
  display: PropTypes.string.isRequired
};

export default UserList;
