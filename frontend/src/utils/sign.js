import Pact from 'pact-lang-api';
import { walletUrl } from '../config';

const NETWORKID = 'mainnet01';
const chainId = '0';
// const network = `https://api.chainweb.com/chainweb/0.0/${NETWORKID}/chain/${chainId}/pact`;
const network = 'http://api.colorblockart.com';


export const mkReq = (cmd) => {
  return {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify(cmd)
  }
};

export const getWalletAccounts = async () => {
  const url = `${walletUrl}/accounts`;
  const cmd = { 
    asset: 'kadena' 
  };
  const result = await fetch(url, mkReq(cmd)).then(res => res.json());
  const accounts = result.data;
  return accounts;
}

/*
export const contractModules = {
  colorblock: 'colorblock-test-v1',
  cbmarket: 'cbmarket-test-v1',
  marketAccount: 'colorblock-test-v1-market'
};
*/
export const contractModules = {
  colorblock: 'free.colorblock',
  cbmarket: 'free.cbmarket1',
  marketAccount: 'colorblock-market'
};

export const getSignedCmd = async (inputCmd, postData={}) => {
  // set cmd correctly
  const fixedCmd = {
    gasPrice: 0.00001,
    gasLimit: 14999,
    chainId: chainId,
    ttl: 600,
    networkId: NETWORKID,
  };
  const signingCmd = mkReq({...fixedCmd, ...inputCmd});

  // get sign from wallet
  console.log('signingCmd', signingCmd);
  const signingResult = await fetch(`${walletUrl}/sign`, signingCmd).then(res => res.json());
  console.log('signingResult', signingResult);

  // send signed cmd
  const signedCmd = mkReq({
    ...postData,
    cmds: [
      signingResult.body
    ]
  });
  return signedCmd;
};

export const getDataFromPactServer = async (code) => {
  const localCmd = {
    keyPairs: [],
    pactCode: code
  };
  const {keyPairs, nonce, pactCode, envData, networkId} = localCmd
  const gasLimit = 3000;
  const meta = Pact.lang.mkMeta('', chainId, 0, gasLimit, 0, 0, 0);
  const cmd = Pact.api.prepareExecCmd(keyPairs, nonce, pactCode, envData, meta, networkId);

  console.log(meta);
  console.log(cmd);
  
  const result = await fetch(`${network}/api/v1/local`, mkReq(cmd)).then(res => res.json());
  const data = result.result.data;
  console.log(data);
  return data || {};

};
