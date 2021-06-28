from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
import app.utils.pact_lang_api as pact

import time

from app.utils.response import get_error_response, get_success_response

colorful_blueprint = Blueprint('colorful', __name__)

@colorful_blueprint.route('/create-wallet', methods=['POST'])
def create_wallet():
    post_data = request.json
    app.logger.debug('post_data: {}'.format(post_data))
            
    address = post_data['address']
    public_key = post_data['public_key']
    pact_code = '(coin.create-account "{}" (read-keyset "ks"))'.format(address)
    env_data = {
        'ks': {
            'keys': [public_key],
            'pred': 'keys-any',
        }
    }
    key_pairs = [ app.config['COLORFUL'] ]
    network_id = 'mainnet01'
    chain_id = '0'
    config = app.config['CHAINWEB']
    meta = pact.mk_meta(key_pairs[0]['address'], config['CHAIN_ID'], config['GAS_PRICE'], config['GAS_LIMIT'], int(time.time()), config['TTL'])
    cmd = pact.prepare_exec_cmd(pact_code, env_data, key_pairs=key_pairs, meta=meta, network_id=network_id)

    print(cmd)

    result = pact.verify(cmd['hash'], cmd['sigs'][0]['sig'], key_pairs[0]['public_key'])

    print(result)


    api_host = 'https://api.chainweb.com/chainweb/0.0/{}/chain/{}/pact'.format(network_id, chain_id)
    result = pact.send_signed(cmd, api_host)
    print(result)

    if isinstance(result, dict):
        listen_cmd = {
            'listen': result['requestKeys'][0]
        }
        app.logger.debug('now listen to: {}'.format(listen_cmd))
        result = pact.fetch_listen(listen_cmd, api_host)
        print(result)
        return get_success_response(result)
    else:
        return get_error_response(result)