import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { serverUrl } from '../../config';

export const ItemPage = (props) => {
  const { itemId } = useParams();
  const itemUrl = `${serverUrl}/static/img/${itemId}.gif`;

  useEffect(() => {
    const fetchItem = async (itemId) => {
      const url = `${serverUrl}/item/${itemId}`;
      const itemData = await fetch(url).then(res => res.json());
      console.log(itemData);
      console.log(itemData.owner);
    };

    fetchItem(itemId);
  }, [itemId]);

  return (
    <div>
      Hello Item {itemId}
      <div>
        <img src={itemUrl} width='100' />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = {
  
};

export default connect(mapStateToProps, mapDispatchToProps)(ItemPage);
