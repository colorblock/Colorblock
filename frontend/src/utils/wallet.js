import Pact from 'pact-lang-api';


const NETWORKID = 'mainnet01';
const chainId = '0';
const network = 'https://api.colorblock.art';

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
    gasPrice: 0.000001,
    gasLimit: 2000,
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

  console.log(localCmd);
  const result = await Pact.fetch.local(localCmd, network).then(res => res.result.data);
  console.log(result);
  return result;

};
