import Pact from 'pact-lang-api';
const NETWORKID = 'mainnet01';
const chainId = '0';
const network = `https://api.chainweb.com/chainweb/0.0/${NETWORKID}/chain/${chainId}/pact`;

export const contractModules = {
  colorblock: 'colorblock-test-v1',
  cbmarket: 'cbmarket-test-v1',
  marketAccount: 'colorblock-test-v1-market'
};

export const mkReq = (cmd) => {
  return {
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify(cmd)
  }
};

export const sendToPactServer = async (inputCmd) => {
  // set cmd correctly
  const fixedCmd = {
    gasPrice: 0.00001,
    gasLimit: 14999,
    chainId: chainId,
    ttl: 600,
    networkId: NETWORKID,
  };
  const signingCmd = {...fixedCmd, ...inputCmd};

  // get sign from wallet
  console.log(signingCmd);
  const signingResult = await fetch('http://127.0.0.1:9467/v1/sign', mkReq(signingCmd)).then(res => res.json());
  console.log(signingResult);

  // send signed cmd
  const signedCmd = {
    cmds: [
      signingResult.body
    ]
  };
  console.log(signedCmd);
  const result = await fetch(`${network}/api/v1/send`, mkReq(signedCmd)).then(res => res.json());
  console.log(result);
  return result;
};

export const getDataFromPactServer = async (code) => {
  const id = 'eDuiUQlMMC7M3QfUbyKWPUfUH0w45n02ecEAqKlfTeA';
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
