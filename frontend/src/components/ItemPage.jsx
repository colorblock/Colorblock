import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { hideSpinner } from '../store/actions/actionCreators';
import { matrixToArray } from '../utils/outputParse';
import { sendToPactServer, getDataFromPactServer } from '../utils/wallet';
import Preview from './Preview';

const ItemPage = props => {
  const urlParams = useParams();
  const [showFrames, setShowFrames] = useState(null);
  const [itemInfo, setItemInfo] = useState({});

  useEffect(() => {
    const displayItem = async () => {
      const { hideSpinner } = props;
      const id = urlParams.id;
      const code = `(colorblock.item-details "${id}")`;
      const result = await getDataFromPactServer(code);
      const itemInfo = {
        title: result.title,
        tags: result.tags,
        description: result.description,
        owner: result.owner
      };
      setItemInfo(itemInfo);
      const frames = matrixToArray(result.frames, result.intervals);
      console.log(frames);
      setShowFrames(frames);
      hideSpinner();

      const code = `(colorblock.item-records "${id}")`;
      const result = await getDataFromPactServer(code);
    }

    displayItem();
  }, []);


  return (
    <div className="item-page">
      { showFrames && (
      <>
      <div
        className="left col-2-4"
      >
        <div className="preview-box__container">
          <div
            style={{
              display: 'float',
              margin: '0 auto'
            }}
          >
          <Preview
            frames={ showFrames.get('list') }
            columns={ showFrames.get('columns') }
            rows={ showFrames.get('rows') }
            cellSize={20}
            duration={ showFrames.get('duration') }
            activeFrameIndex={ 0 }
            animate={ true }
            animationName="item-page-animation"
          />
          </div>
        </div>
        <div className='item-info'>
          <p>Title: { itemInfo.title }</p>
          <p>Description: { itemInfo.description }</p>
          <p>Tags: { itemInfo.tags }</p>
          <p>Owned by: { `**${itemInfo.owner.slice(-4)}` }</p>
        </div>
      </div>
      <div className="right col-2-4">
        <p>here to record status</p>
      </div>
      </>
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  loading: state.present.get('loading')
});
const mapDispatchToProps = dispatch => ({
  hideSpinner: () => dispatch(hideSpinner())
});

export default connect(mapStateToProps, mapDispatchToProps)(ItemPage);
