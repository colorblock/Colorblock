import app.utils.pact_lang_api as pact
import time

pact_code = 'code'
env_data = {'asd': 'sd'}
key_pairs = [{
    'public_key': '65368c1ef88b0ec7a8f6fb3174078c83f534125e7ec662750b9d42cc615babd5',
    'secret_key': '67c7cc8d87e3c6d9508ebb71734129e02772ae46ce080575a773a2561a1afc10'
}]
network_id = 'mainnet01'
chain_id = '0'
meta = pact.mk_meta(key_pairs[0]['public_key'], chain_id, 0.00001, 10, time.time(), 600)
cmd = pact.prepare_exec_cmd(pact_code, env_data, key_pairs=key_pairs, nonce='abc', meta=meta, network_id=network_id)

print(cmd)

result = pact.verify(cmd['hash'], cmd['sigs'][0]['sig'], key_pairs[0]['public_key'])

print(result)


api_host = 'https://api.chainweb.com/chainweb/0.0/{}/chain/{}/pact'.format(network_id, chain_id)
result = pact.send_signed(cmd, api_host)
print(result)