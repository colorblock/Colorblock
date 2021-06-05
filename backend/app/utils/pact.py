from flask import current_app as app
from datetime import datetime
import requests
import hashlib
import json
import yaml
import time

from app.utils.response import get_error_response, get_success_response
from app.utils.crypto import hex_to_base64_url

def send_req(post_cmd):
    return_data = {}

    # send data to pact url
    try:
        res = requests.post(app.config['PACT_SEND_URL'], json=post_cmd)
        app.logger.debug('SEND response text: {}'.format(res.text))

        # extract request key
        request_key_data = res.json()
        request_key = request_key_data['requestKeys'][0]
        app.logger.debug('request key: {}'.format(request_key))

        for i in range(60):
            # fetch result for request key
            res = requests.post(app.config['PACT_POLL_URL'], json=request_key_data)
            app.logger.debug('POLL response text: {}'.format(res.text))

            # extract result
            result = res.json()
            app.logger.debug('result: {}'.format(result))
            if request_key not in result:
                time.sleep(1)
                continue

            result = result[request_key]

            # pack return_data
            if result['result']['status'] == 'success':
                return_data = get_success_response(result['result']['data']) 
                return_data['tx_id'] = result['txId']
            else:
                return_data = get_error_response('pact error: {}'.format(result['result']['error']['message']))

            break

    except Exception as e:
        app.logger.error(e)
        return_data = get_error_response('network error')

    app.logger.debug('return data: {}'.format(return_data))
    return return_data

def local_req(local_cmd):
    return_data = {}

    # send data to pact url
    try:
        res = requests.post(app.config['PACT_LOCAL_URL'], json=local_cmd)
        app.logger.debug(res.text)
        result = res.json()

        # pack return_data
        if result['result']['status'] == 'success':
            return_data = get_success_response(result['result']['data']) 
        else:
            return_data = get_error_response('pact error: {}'.format(result['result']['error']['message']))

    except Exception as e:
        app.logger.error(e)
        return_data = get_error_response('network error')

    app.logger.debug('return data: {}'.format(return_data))
    return return_data

def build_unsigned_send_cmd(pact_code, pact_data={}, cmd_config={}, output_path=''):
    config = app.config['CHAINWEB']
    cmd = {
        'networkId': config['NETWORK'],
        'signers': [{
            'public': cmd_config['public_key'],
            'caps': cmd_config['capabilities'],
        }],
        'data': pact_data,
        'code': pact_code,
        'publicMeta': {
            'ttl': 7200,
            'gasLimit': cmd_config['gas_limit'],
            'gasPrice': cmd_config['gas_price'],
            'chainId': config['CHAIN_ID'],
            'sender': cmd_config['sender'],
        },
    }
    
    with open(output_path, 'w') as outfile:
        yaml.dump(cmd, outfile, default_flow_style=False)

    return 'success'

def build_local_cmd(pact_code, pact_data={}):
    config = app.config['CHAINWEB']
    cmd = {
        'payload': {
            'exec': {
                'code': pact_code,
                'data': pact_data,
            },
        },
        'meta': {
            'creationTime': int(datetime.timestamp(datetime.now())),
            'ttl': 7200,
            'gasLimit': 1500000,
            'gasPrice': 0.0000000001,
            'chainId': config['CHAIN_ID'],
            'sender': 'COLORBLOCK',
        },
        'networkId': config['NETWORK'],
        'signers': [],
        'nonce': str(datetime.now()),
    }
    pact_cmd = json.dumps(cmd)
    app.logger.debug(pact_cmd)

    # generate hash
    hash2b = hashlib.blake2b(digest_size=32)
    hash2b.update(pact_cmd.encode('utf-8'))
    hash_code = hex_to_base64_url(hash2b.hexdigest())

    result = {
        'hash': hash_code,
        'sigs': [],
        'cmd': pact_cmd,
    }
    return result