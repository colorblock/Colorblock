import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { serverUrl } from '../../config';

export const ItemPage = (props) => {
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

  return item && (
    <div>
      Hello Item {itemId}
      <div>
        <img src={item.url} className='w-40' alt={item.title} />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(ItemPage);
