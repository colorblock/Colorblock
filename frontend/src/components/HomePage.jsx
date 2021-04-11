import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { hideSpinner } from '../store/actions/actionCreators';
import Gallery from "react-photo-gallery";
import renderCanvasGIF from '../utils/canvasGIF';
import { getDataFromPactServer } from '../utils/wallet';
import { matrixToArray } from '../utils/outputParse';
import { addItem } from '../store/actions/actionCreators';

const HomePage = props => {
  const { items } = props; 

  useEffect(() => {

    const fetchItems = async () => {

      const codeMarket = `(colorblock.all-items)`;
      const fetchedItems = await getDataFromPactServer(codeMarket);
      fetchedItems.map(item => {
        const data = matrixToArray(item.frames, item.intervals);
        const frames = data.get('list');
        const columns = data.get('columns');
        const rows = data.get('rows');
        const duration = data.get('duration');
        const cellSize = 20;
        const { addItem }= props;
        renderCanvasGIF({
          type: 'gif',
          frames,
          activeFrame: null,
          columns,
          rows,
          cellSize,
          duration
          }, 
          false, 
          (blob) => {
            const newItem = {
              id: item.id,
              columns,
              rows,
              imageUrl: blob
            };
            addItem(newItem);
          }
        );
      });

      const { hideSpinner } = props;
      hideSpinner();
    };

    fetchItems();
  }, []);

  const generatePhotos = () => {
    const photos = items.toJS().map(item => {
      const ratio = item.rows / item.columns;
      const width = 4;
      return {
        id: item.id,
        src: item.imageUrl,
        width,
        height: width * ratio
      };
    });
    return photos;
  };
  const onClick = e => {
    const id = e.target.id;
    const newLink = `/item/${id}`;
    window.location.href = newLink;
  };

  return (
    <>
      { items.size > 0 && <Gallery photos={ generatePhotos() } direction={"column"} onClick={onClick}/> }
    </>
  );
};

const mapStateToProps = state => ({
  loading: state.present.get('loading'),
  items: state.present.get('items')
});
const mapDispatchToProps = dispatch => ({
  hideSpinner: () => dispatch(hideSpinner()),
  addItem: (item) => dispatch(addItem(item)),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
