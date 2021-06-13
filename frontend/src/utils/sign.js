import Pact from 'pact-lang-api';
import { toast } from 'react-toastify';
import { signConfig, walletUrl } from '../config';

const NETWORKID = 'mainnet01';
const chainId = '0';
// const network = `https://api.chainweb.com/chainweb/0.0/${NETWORKID}/chain/${chainId}/pact`;
const network = 'http://api.colorblockart.com';

export const withCors = {
  credentials: 'include'
};

export const mkReq = (cmd=null, cors=true) => {
  const body = JSON.stringify(cmd || '');
  let req = {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body
  }
  if (cors) {
    req = {
      ...req,
      ...withCors
    }
  }
  return req;
};

export const getWalletAccounts = async () => {
  const url = `${walletUrl}/accounts`;
  const cmd = { 
    asset: 'kadena' 
  };
  const result = await fetch(url, mkReq(cmd, false)).then(res => res.json());
  const accounts = result.data;
  return accounts;
}

export const getSignedCmd = async (inputCmd, postData={}) => {
  // set cmd correctly
  const fixedCmd = {
    gasPrice: signConfig.gasPrice,
    gasLimit: signConfig.gasLimit,
    chainId: chainId,
    ttl: 600,
    networkId: NETWORKID,
  };
  const signingCmd = mkReq({...fixedCmd, ...inputCmd}, false);

  // get sign from wallet
  console.log('signingCmd', signingCmd);
  const signingResult = await fetch(`${walletUrl}/sign`, signingCmd)
    .then(res => res.json())
    .catch(() => toast.error('please open Zelcore server'));
  console.log('signingResult', signingResult);

  // send signed cmd
  if (signingResult) {
    const signedCmd = mkReq({
      ...postData,
      cmds: [
        signingResult.body
      ]
    });
    return signedCmd;
  } else {
    return null;
  }
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
