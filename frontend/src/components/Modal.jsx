import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ModalReact from 'react-modal';
import {
  disableBodyScroll,
  enableBodyScroll,
  clearAllBodyScrollLocks
} from 'body-scroll-lock';
import * as actionCreators from '../store/actions/actionCreators';
import zelcoreImg from '../assets/zelcore.png';
import RadioSelector from './RadioSelector';
import LoadDrawing from './LoadDrawing';
import Preview from './Preview';
import Form from './Form';
import DownloadDrawing from './DownloadDrawing';
import KeyBindingsLegend from './KeyBindingsLegend';
import { Button, Wrapper, Menu, MenuItem } from 'react-aria-menubutton';
import { arrayToMatrix } from '../utils/outputParse';
import { sendToPactServer, getDataFromPactServer } from '../utils/wallet';

class Modal extends React.Component {
  static generateRadioOptions(props) {
    let options;

    if (props.type == 'wallet') {
      options = [
        {
          value: 'zelcore',
          description: 'Zelcore',
          labelFor: 'Zelcore',
          id: 1
        },
        {
          value: 'chainweaver',
          description: 'Chainweaver',
          labelFor: 'Chainweaver',
          id: 2
        }
      ];
    }

    else if (props.type !== 'load') {
      options = [
        {
          value: 'single',
          description: 'single',
          labelFor: 'single',
          id: 3
        }
      ];

      if (props.frames.size > 1) {
        const spritesheetSupport =
          props.type === 'download' || props.type === 'twitter';
        const animationOptionLabel = spritesheetSupport ? 'GIF' : 'animation';

        const animationOption = {
          value: 'animation',
          description: animationOptionLabel,
          labelFor: animationOptionLabel,
          id: 4
        };
        options.push(animationOption);

        if (spritesheetSupport) {
          options.push({
            value: 'spritesheet',
            description: 'spritesheet',
            labelFor: 'spritesheet',
            id: 5
          });
        }
      }
    } else {
      options = [
        {
          value: 'storage',
          description: 'Stored',
          labelFor: 'stored',
          id: 0
        },
        {
          value: 'import',
          description: 'Import',
          labelFor: 'import',
          id: 1
        },
        {
          value: 'export',
          description: 'Export',
          labelFor: 'export',
          id: 2
        },
        {
          value: 'extractData',
          description: 'Useful Data',
          labelFor: 'useful-data',
          id: 3
        }
      ];
    }

    return options;
  }

  constructor(props) {
    super(props);
    this.state = {
      previewType: 'single',
      loadType: 'storage',
      walletType: 'zelcore',
      accounts: [],
      selectedAccount: null
    };
    this.modalBodyRef = React.createRef();
    this.modalContainerRef = React.createRef();
    this.showModal = () => disableBodyScroll(this.modalContainerRef.current);
    this.closeModal = () => {
      enableBodyScroll(this.modalContainerRef.current);
      props.close();
    };
    this.changeRadioType = this.changeRadioType.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.fetchAllProjects = this.fetchAllProjects.bind(this);
    this.scrollTop = () => this.modalBodyRef.current.scrollTo(0, 0);
    ModalReact.setAppElement('body');
  }

  componentWillUnmount() {
    clearAllBodyScrollLocks();
  }

  mkReq(cmd) {
    return {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(cmd)
    }
  }

  async connectToWallet() {
    const url = 'http://127.0.0.1:9467/v1/accounts';
    const cmd = { asset: 'kadena' };
    const result = await fetch(url, this.mkReq(cmd)).then(res => res.json());
    const accounts = result.data;
    this.setState({
      accounts: accounts
    });
  }

  async onSubmit(values) {
    const { title, tags, description } = values;
    const { selectedAccount, previewType } = this.state;
    const { account, frames, columns, rows, duration, activeFrameIndex } = this.props;
    const frameList = frames.toJS();
    let newFrames = arrayToMatrix(frameList, columns, rows);
    let intervals = frameList.map(frame => Math.round(frame.interval * duration) / 100);
    if (previewType === 'single') {
      newFrames = newFrames.slice(activeFrameIndex, activeFrameIndex + 1);
      intervals  = [duration];
    }
    const type = 1;
    const code = `(colorblock.create-item "${title}" (read-msg "tags") "${description}" (read-msg "frames") (read-msg "intervals") "${account}")`;
    console.log('on Submit3', code);
    const cmd = {
      //code: `(colorblock.create-item "${title}" (read-msg "tags") "${description}" (read-msg "frames") (read-msg "intervals") "${account}")`,
      code: `(colorblock.create-item-with-new-user "${title}" (read-msg "tags") "${description}" (read-msg "frames") (read-msg "intervals") "${account}" (read-keyset "accountKeyset"))`,
      caps: [{
        role: 'Identity Verification',
        description: 'Identity Verification',
        cap: {
          name: 'colorblock.OWN-ACCOUNT',
          args: [account]
        }
      }],
      sender: account,
      signingPubKey: account,
      data: {
        accountKeyset: { 
          keys: [account],
          pred: 'keys-all'
        },
        tags,
        frames: newFrames,
        intervals
      }
    };
    const result = await sendToPactServer(cmd);
    console.log('ready to fetch all projects');
    await this.fetchAllProjects();
  }

  async fetchAllProjects() {
    console.log('in fetch all projects');
    const { account } = this.props;
    //const code = `(colorblock.items-of "${account}")`;
    const code = `(colorblock.items-of "admin")`;
    //const code = `(colorblock.all-items)`;
    //const code = `(colorblock.details "${account}")`;
    const result = getDataFromPactServer(code);
  }

  getModalContent(props) {
    const { previewType, loadType } = this.state;
    const options = this.constructor.generateRadioOptions(props);
    let content;
    const previewBlock = (
      <>
        {previewType !== 'spritesheet' ? (
          <div className="modal__preview--wrapper">
            <Preview
              key="0"
              frames={props.frames}
              columns={props.columns}
              rows={props.rows}
              cellSize={props.type === 'preview' ? props.cellSize : 5}
              duration={props.duration}
              activeFrameIndex={props.activeFrameIndex}
              animate={previewType === 'animation'}
            />
          </div>
        ) : null}
      </>
    );
    const isLoadModal = props.type === 'load';
    const radioType = isLoadModal ? 'load' : 'preview';
    let radioOptions = (
      <div className={`modal__${radioType}`}>
        <RadioSelector
          name={`${radioType}-type`}
          selected={isLoadModal ? loadType : previewType}
          change={this.changeRadioType}
          options={options}
        />
      </div>
    );

    switch (props.type) {
      case 'load':
        content = (
          <LoadDrawing
            loadType={loadType}
            close={this.closeModal}
            open={props.open}
            frames={props.frames}
            columns={props.columns}
            rows={props.rows}
            cellSize={props.cellSize}
            paletteGridData={props.paletteGridData}
            actions={{
              setDrawing: props.actions.setDrawing,
              sendNotification: props.actions.sendNotification
            }}
          />
        );
        break;
      case 'upload':
        content = (
          <>
            <div className="col-2-4">
              <div className="modal__preview--wrapper">
                <Preview
                  key="0"
                  frames={props.frames}
                  columns={props.columns}
                  rows={props.rows}
                  cellSize={ 20 * 16 / props.columns}
                  duration={props.duration}
                  activeFrameIndex={props.activeFrameIndex}
                  animate={previewType === 'animation'}
                />
              </div>
            </div>
            <div className="col-2-4">
              <Form 
                frames={props.frames}
                onSubmit={ this.onSubmit }
              />
              <button onClick={ this.fetchAllProjects }>For Test Local CMD</button>
            </div>
          </>
        );
        break;
      case 'download':
        content = (
          <>
            {previewBlock}
            <DownloadDrawing
              frames={props.frames}
              activeFrame={props.activeFrame}
              columns={props.columns}
              rows={props.rows}
              cellSize={props.cellSize}
              duration={props.duration}
              downloadType={previewType}
              actions={{ sendNotification: props.actions.sendNotification }}
            />
          </>
        );
        break;
      case 'keybindings':
        content = (
          <>
            <KeyBindingsLegend />
          </>
        );
        radioOptions = null;
        break;
      case 'wallet':
        content = (
          <>
            <div className="center">
              <span>Choose Your Wallet</span>
            </div>
            <div>
              <div className='modal__wallet-type'>
                <RadioSelector
                  name='wallet-type'
                  selected={this.state.walletType}
                  change={this.changeRadioType}
                  options={options}
                />
              </div>
            </div>
            <div>
              First step:
              <br />
              Log into your {this.state.walletType} wallet, and turn on server option. 
            </div>
            <div>
              <img src={zelcoreImg} alt="zelcore" />
            </div>
            <br />
            <div>
              Second step:
              <br />
              Click the button below to connect to wallet, and confirm on the wallet page.
            </div>
            <div>
              <button
                type='button'
                onClick={ () => this.connectToWallet() }
              >
              Connect to {this.state.walletType}
              </button>
            </div>
            <br />
            <div>
              Last step:
              <br />
              select your {this.state.walletType} account below.
            </div>
            <div>
              <Wrapper
                className='AriaMenuButton'
                onSelection={(account) => {
                  this.setState({
                    selectedAccount : account
                  });
                }}
              >
                <Button 
                  className='AriaMenuButton-trigger'>
                  { this.props.selectedAccount || 'select an account' }
                </Button>
                <Menu>
                  <ul className='AriaMenuButton-menu'>
                  {
                    this.state.accounts.map((word, i) => {
                      return (
                        <li key={i}>
                          <MenuItem className='MyMenuButton-menuItem'>
                            {word}
                          </MenuItem>
                        </li>
                      );
                    })
                  }</ul>
                </Menu>
              </Wrapper>
            </div>
            <div>
              <button
                type='button'
                onClick={ () => {
                  props.actions.setAccount(this.state.selectedAccount);
                  this.closeModal();
                }}
              >
              Let's start
              </button>
            </div>
          </>
        );
        break;
      default:
        content = <>{previewBlock}</>;
        break;
    }

    return (
      <div className="modal">
        <div className="modal__header">
          <button type="button" className="close" onClick={this.closeModal}>
            x
          </button>
        </div>
        { props.type !== 'wallet' ? radioOptions : null }
        <div className="modal__body" ref={this.modalBodyRef}>
          {content}
        </div>
      </div>
    );
  }

  changeRadioType(value, type) {
    const newState = {};
    this.scrollTop();
    switch (type) {
      case 'wallet-type':
        newState.walletType = value;
      case 'load-type':
        newState.loadType = value;
        break;
      default:
        newState.previewType = value;
    }
    this.setState(newState);
  }

  render() {
    const { isOpen, type } = this.props;
    const styles = {
      content: {
        overflow: 'hidden',
        display: 'flex'
      }
    };

    return (
      <ModalReact
        isOpen={isOpen}
        onRequestClose={this.closeModal}
        onAfterOpen={this.showModal}
        ref={this.modalContainerRef}
        style={styles}
        contentLabel={`Dialog ${type || ''}`}
      >
        {this.getModalContent(this.props)}
      </ModalReact>
    );
  }
}

const mapStateToProps = state => {
  const frames = state.present.get('frames');
  const activeFrameIndex = frames.get('activeIndex');
  return {
    account: state.present.get('account'),
    frames: frames.get('list'),
    activeFrameIndex,
    activeFrame: frames.getIn(['list', activeFrameIndex]),
    paletteGridData: state.present.getIn(['palette', 'grid']),
    columns: frames.get('columns'),
    rows: frames.get('rows'),
    cellSize: state.present.get('cellSize'),
    duration: state.present.get('duration')
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actionCreators, dispatch)
});

const ModalContainer = connect(mapStateToProps, mapDispatchToProps)(Modal);
export default ModalContainer;
