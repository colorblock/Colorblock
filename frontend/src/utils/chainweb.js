import { networkId, apiHost, gasPrice, gasLimit, ttl, chainId } from '../config';
import Pact from 'pact-lang-api';
import { getTimestamp } from './tools';

export const fetchLocal = (code) => {
  const localCmd = {
    pactCode: code,
    envData: {},
    meta: Pact.lang.mkMeta('', '', gasPrice, gasLimit, 0, ttl),
    networkId
  };
  return Pact.fetch.local(localCmd, apiHost);
};

export const fetchSend = (cmd) => {
  return Pact.wallet.sendSigned(cmd, apiHost);
};

export const getSendCmd = (cmd) => {
  const meta = Pact.lang.mkMeta(cmd.sender, chainId, gasPrice, gasLimit, getTimestamp(), ttl);
  const sendCmd = Pact.api.prepareExecCmd(cmd.keyPairs, undefined, cmd.pactCode, cmd.envData, meta, networkId);
  return sendCmd;
};

export const fetchListen = (cmd) => {
  return Pact.fetch.listen(cmd, apiHost);
};