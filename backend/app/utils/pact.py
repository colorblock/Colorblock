from flask import current_app as app
from datetime import datetime
import subprocess
import requests
import hashlib
import json
import time
import os

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

        listen_data = {
            'listen': request_key
        }
        res = requests.post(app.config['PACT_LISTEN_URL'], json=listen_data)
        app.logger.debug('LISTEN response text: {}'.format(res.text))

        # extract result
        result = res.json()
        app.logger.debug('result: {}'.format(result))

        # pack return_data
        if result['result']['status'] == 'success':
            return_data = get_success_response(result['result']['data']) 
            return_data['tx_id'] = result['txId']
        else:
            return_data = get_error_response('pact error: {}'.format(result['result']['error']['message']))

    except Exception as e:
        app.logger.error(e)
        return_data = get_error_response('network error')

    app.logger.debug('return data: {}'.format(return_data))
    return return_data

def local_req(local_cmd):
    return_data = {}

    # send data to pact url
    for i in range(app.config['RETRY_TIMES']):
        try:
            res = requests.post(app.config['PACT_LOCAL_URL'], json=local_cmd)
            app.logger.debug(res.text)
            result = res.json()

            # pack return_data
            if result['result']['status'] == 'success':
                return_data = get_success_response(result['result']['data']) 
            else:
                return_data = get_error_response('pact error: {}'.format(result['result']['error']['message']))

            break

        except Exception as e:
            app.logger.error(e)
            return_data = get_error_response('network error')
            time.sleep(1)

    app.logger.debug('return data: {}'.format(return_data))
    return return_data

def add_manager_sig(signed_cmd):
    result = subprocess.run(['pact', 'add-sig', '../../instance/keys-colorful.yaml'], stdout=subprocess.PIPE, text=True, input=json.dumps(signed_cmd))
    app.logger.debug(result)

def build_unsigned_send_cmd(pact_code, pact_data={}, cmd_config={}):
    config = app.config['CHAINWEB']
    modules = get_module_names()
    accounts = get_accounts()

    gas_cap = {
        'name': modules['colorblock-gas-payer'],
        'args': ['hi', {'int': 1}, 1.0]
    }
    manager_sig = {
        'public': app.config['COLORBLOCK_CUTE']['public'],
        'caps': [],
    }
    cmd = {
        'networkId': cmd_config.get('network_id', config['NETWORK_ID']),
        'signers': [{
            'public': cmd_config.get('public_key', ''),
            'caps': cmd_config.get('capabilities', []) + [gas_cap],
        }] + [manager_sig],
        'data': pact_data,
        'code': pact_code,
        'publicMeta': {
            'ttl': cmd_config.get('ttl', config['TTL']),
            'gasLimit': cmd_config.get('gas_limit', config['GAS_LIMIT']),
            'gasPrice': cmd_config.get('gas_price', config['GAS_PRICE']),
            'chainId': cmd_config.get('chain_id', config['CHAIN_ID']),
            'sender': cmd_config.get('sender', accounts['gas-payer']),
        },
    }

    return cmd

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
        'networkId': config['NETWORK_ID'],
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

def get_module_names():
    in_test = os.environ.get('PACT_MODULE_TEST')
    module_type = 'test' if in_test else 'prod'
    modules = app.config['MODULES']
    return modules[module_type]

def get_accounts():
    in_test = os.environ.get('PACT_MODULE_TEST')
    module_type = 'test' if in_test else 'prod'
    accounts = app.config['ACCOUNTS']
    return accounts[module_type]