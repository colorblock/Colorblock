import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { hideSpinner } from '../store/actions/actionCreators';
import { matrixToArray } from '../utils/outputParse';
import { sendToPactServer, getDataFromPactServer } from '../utils/wallet';
import Preview from './Preview';
import { useFormik } from 'formik';
import renderCanvasGIF from '../utils/canvasGIF';

const MARKET_ACCOUNT = 'colorblock-market';

const ItemPage = props => {
  const urlParams = useParams();
  const [itemInfo, setItemInfo] = useState({});
  const [imageUrl, setImageUrl] = useState(null);
  const [formType, setFormType] = useState(null);
  const { account } = props;

  useEffect(() => {
    const displayItem = async () => {
      const { hideSpinner } = props;
      await updateItem();
      hideSpinner();
    }

    displayItem();
  }, []);

  const updateItem = async () => {
    const id = urlParams.id;
    const codeBasic = `(colorblock.item-details "${id}")`;
    const result = await getDataFromPactServer(codeBasic);
    const codeMarket = `(cbmarket.item-sale-status "${id}")`;
    const marketData = await getDataFromPactServer(codeMarket);
    console.log(marketData);
    const newItemInfo = {
      id,
      title: result.title,
      tags: result.tags,
      description: result.description,
      owner: result.owner === MARKET_ACCOUNT ? marketData.seller : result.owner,
      isOnSale: marketData['on-sale'],
      price: marketData.price
    };
    setItemInfo(newItemInfo);

    const data = matrixToArray(result.frames, result.intervals);
    const frames = data.get('list');
    const columns = data.get('columns');
    const rows = data.get('rows');
    const duration = data.get('duration');
    const cellSize = 20;
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
        setImageUrl(blob);
      }
    );
  };

  const releaseItem = async (id, price) => {
    const cmd = {
      code: `(cbmarket.release "${account}" "${id}" ${price})`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: 'colorblock.OWN-ACCOUNT',
          args: [account]
        }
      }],
      sender: account,
      signingPubKey: account
    };
    const result = await sendToPactServer(cmd);
    console.log(result);
    const code = `(cbmarket.item-sale-status "${id}")`;
    const data = await getDataFromPactServer(code);
    console.log(data);
    const newItemInfo = {
      isOnSale: data['on-sale'],
      price: data.price
    };
    setItemInfo({...itemInfo, ...newItemInfo});
  };

  const modifyPrice = async (id, price) => {
    const cmd = {
      code: `(cbmarket.modify "${account}" "${id}" ${price})`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: 'colorblock.OWN-ACCOUNT',
          args: [account]
        }
      }],
      sender: account,
      signingPubKey: account
    };
    const result = await sendToPactServer(cmd);
    console.log(result);
    const code = `(cbmarket.item-sale-status "${id}")`;
    const data = await getDataFromPactServer(code);
    console.log(data);
    const newItemInfo = {
      isOnSale: data['on-sale'],
      price: data.price
    };
    setItemInfo({...itemInfo, ...newItemInfo});
  };

  const recallItem = async (id) => {
    const cmd = {
      code: `(cbmarket.recall "${account}" "${id}")`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: 'colorblock.OWN-ACCOUNT',
          args: [account]
        }
      }],
      sender: account,
      signingPubKey: account
    };
    const result = await sendToPactServer(cmd);
    console.log(result);
    const code = `(cbmarket.item-sale-status "${id}")`;
    const data = await getDataFromPactServer(code);
    console.log(data);
    const newItemInfo = {
      isOnSale: data['on-sale'],
      price: data.price
    };
    setItemInfo({...itemInfo, ...newItemInfo});
  };

  const purchaseItem = async (id) => {
    const cmd = {
      code: `(cbmarket.purchase-with-new-user "${account}" "${id}" (read-keyset "accountKeyset"))`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: 'coin.DEBIT',
          args: [account]
        }
      }],
      data: {
        accountKeyset: { 
          keys: [account],
          pred: 'keys-all'
        }
      },
      sender: account,
      signingPubKey: account
    };
    const sendResult = await sendToPactServer(cmd);
    console.log(sendResult);
    const codeBasic = `(colorblock.item-details "${id}")`;
    const result = await getDataFromPactServer(codeBasic);
    const code = `(cbmarket.item-sale-status "${id}")`;
    const data = await getDataFromPactServer(code);
    console.log(data);
    const newItemInfo = {
      isOnSale: data['on-sale'],
      price: data.price,
      owner: result.owner
    };
    setItemInfo({...itemInfo, ...newItemInfo});
  };

  const formik = useFormik({
    initialValues: {
      price: 0,
    },
    onSubmit: (values, formikBag) => {
      switch(formType) {
        case 'release':
          releaseItem(itemInfo.id, values.price);
          break;
        case 'modify':
          modifyPrice(itemInfo.id, values.price);
          break;
        case 'recall':
          recallItem(itemInfo.id);
          break;
        case 'purchase':
          purchaseItem(itemInfo.id);
          break;
        default:
          return;
      }
    }
  });

  return (
    <div className="item-page">
      { itemInfo.owner && imageUrl && (
      <>
      <div
        className="left col-2-4"
      >
        <div className="preview-box__container">
          <img src={ imageUrl } 
            style={{
              display: 'block',
              margin: '0 auto',
              width: '60%'
            }}
          />
        </div>
        <div className='item-info'>
          <p>Title: { itemInfo.title }</p>
          <p>Description: { itemInfo.description }</p>
          <p>Tags: { itemInfo.tags }</p>
          <p>Owned by: { `**${itemInfo.owner.slice(-4)}` }</p>
        </div>
      </div>
      <div className="right col-2-4 action-board">
        { account === itemInfo.owner ? 
          ( 
            <div className="item-info">
              { itemInfo.isOnSale ? 
                (
                <>
                <label>Your artwork is on sale, price: {itemInfo.price}</label>
                <form onSubmit={ values => {
                  setFormType('modify');
                  formik.handleSubmit(values);
                }}>
                  <label htmlFor="price">Change The selling price in KDA</label>
                  <input 
                    id='modifyPrice'
                    name='price'
                    type='number'
                    style={{
                      width: '60%'
                    }}
                    onChange={formik.handleChange}
                    value={formik.values.price}
                  />
                  <br />
                  <label>Modify now</label>
                  <button type="submit">Modify</button>
                </form>
                <br />
                <form onSubmit={ values => {
                  setFormType('recall');
                  formik.handleSubmit(values);
                }}>
                  <label>Or you can recall from market</label>
                  <br />
                  <button type="submit">Recall</button>
                </form>
                </>
                ) :
                (
                <>
                <label>You can release to market for sale at any time</label>
                <form onSubmit={ values => {
                  setFormType('release');
                  formik.handleSubmit(values);
                }}>
                  <label htmlFor="price">The selling price in KDA</label>
                  <input 
                    id='setPrice'
                    name='price'
                    type='number'
                    onChange={formik.handleChange}
                    value={formik.values.price}
                  />
                  <button type="submit">Release</button>
                </form>
                </>
                )
              }
            </div>
          ) :
          ( 
            <div className="item-info">
              <label>This artwork is on sale, price: {itemInfo.price}</label>
              <br />
              <form onSubmit={ values => {
                setFormType('purchase');
                formik.handleSubmit(values);
              }}>
                <label>Purchase now</label>
                <button type='submit'>Purchase</button>
                <br />
                <label style={{ fontSize: '5px' }}>The purchase fees is 1% of price</label>
              </form>
            </div>
          )
        }
      </div>
      </>
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  account: state.present.get('account'),
  loading: state.present.get('loading')
});
const mapDispatchToProps = dispatch => ({
  hideSpinner: () => dispatch(hideSpinner())
});

export default connect(mapStateToProps, mapDispatchToProps)(ItemPage);
