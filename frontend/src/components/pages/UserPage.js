import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { serverUrl } from '../../config';

const UserPage = (props) => {
  const { userId } = useParams();
  const { userData, setUserData } = useState({
    id: 'ebf4xxxxdcdb',
    itemIds: ['c246a25c421f7eb1']
  });

  useEffect(() => {
    const fetchUser = async (userId) => {
      const url = `${serverUrl}/user/${userId}`;
      const userData = await fetch(url).then(res => res.json());
      console.log(userData);
    };

    fetchUser(userId);
  }, [userId]);

  return (
    <div>
      
    </div>
  );
};

export default UserPage;
