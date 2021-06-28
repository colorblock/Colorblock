from flask import current_app as app
import requests
import json

from app.utils.crypto import base64_to_string

def fetch_latest_block(chain_id):
    '''
    return: { height, hash }
    '''
    config = app.config['CHAINWEB']
    url = '{}/chainweb/0.0/{}/cut'.format(config['HOST'], config['NETWORK_ID'])
    res = requests.get(url)
    data = res.json()
    block = data['hashes'][str(chain_id)]
    return block

def fetch_previous_blocks(block_hash, limit=10):
    '''
    return: [{
        height,
        hash,
        payload_hash,
        ...
    }]
    '''
    config = app.config['CHAINWEB']
    url = '{}/chainweb/0.0/{}/chain/{}/header/branch'.format(config['HOST'], config['NETWORK_ID'], config['CHAIN_ID'])
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json;blockheader-encoding=object'
    }
    post_data = {
        'upper': [block_hash],
        'lower': []
    }
    params = {
        'limit': limit
    }
    res = requests.post(url, headers=headers, params=params, json=post_data)
    data = res.json()['items']
    return data

def fetch_payloads(blocks):
    '''
    return: [{
        height,
        hash,
        payload_hash,
        inputs -> {
            hash,
            sigs,
            cmd
        }
        outputs -> [{
            txId,
            module: { namespace, name }
        }]
    }]
    '''
    config = app.config['CHAINWEB']
    url = '{}/chainweb/0.0/{}/chain/{}/payload/outputs/batch'.format(config['HOST'], config['NETWORK_ID'], config['CHAIN_ID'])
    headers = {
        'Content-Type': 'application/json',
    }
    post_data = [v['payload_hash'] for v in blocks]
    res = requests.post(url, headers=headers, json=post_data)
    data = res.json()

    payloads = []
    for index, payload in enumerate(data):
        inputs = []
        outputs = []
        for tx in payload['transactions']:
            input = json.loads(base64_to_string(tx[0]))
            output = json.loads(base64_to_string(tx[1]))
            inputs.append(input)
            outputs.append(output)

        block = blocks[index]
        block['inputs'] = inputs
        block['outputs'] = outputs
        payloads.append(block)
    
    return payloads
