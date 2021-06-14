import { toast } from 'react-toastify';
import { signConfig, walletUrl } from '../config';

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
  const result = await fetch(url, mkReq(cmd, false))
    .then(res => res.json())
    .catch(() => {
      toast.error('Please open your wallet API');
    });

  if (result) {
    if (result.status === 'success') {
      const accounts = result.data;
      return accounts;
    } else {
      // refused by wallet
      toast.error(result.data);
      console.log(result.data);
      return;
    }
  }
}

export const getSignedCmd = async (inputCmd, postData={}) => {
  // calc gas fees
  const inputSize = JSON.stringify(inputCmd).length;
  const gasLimit = Math.floor(Math.min(
    signConfig.gasLimit,
    (inputSize + signConfig.minGasLimit) * signConfig.gasLimitRate
  ));
  console.log(inputSize, gasLimit);
  // set cmd correctly
  const fixedCmd = {
    gasPrice: signConfig.gasPrice,
    gasLimit,
    chainId: signConfig.chainId,
    ttl: 600,
    networkId: signConfig.networkId,
  };
  const signingCmd = mkReq({...fixedCmd, ...inputCmd}, false);

  // get sign from wallet
  console.log('signingCmd', signingCmd);
  const signingResult = await fetch(`${walletUrl}/sign`, signingCmd)
    .then(res => {
      if (res.ok) {
        return res;
      } else {
        return res.text().then(text => {
          throw new Error(text);
        });
      }
    })
    .then(res => res.json())
    .catch(error => {
      console.log(error);
      if (error.message === 'Cancelled') {
        toast.error('User cancelled sign');
      } else {
        toast.error('Please follow the instructions to turn on Wallet Server');
      }
    });
  console.log('signingResult', signingResult);

  // send signed cmd
  if (signingResult) {
    if (signingResult.status === 'error') {
      // refused by wallet
      toast.error(signingResult.data);
      console.log(signingResult.data);
      return;
    } else {
      const signedCmd = mkReq({
        ...postData,
        cmds: [
          signingResult.body
        ]
      });
      return signedCmd;
    }
  }
};
