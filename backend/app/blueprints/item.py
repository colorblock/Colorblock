from re import I
from flask import Blueprint, request, current_app as app
import requests
import json
import time

from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash

item_blueprint = Blueprint('item', __name__)

@item_blueprint.route('/', methods=['GET'])
def get_item():
    app.logger.debug('123')
    return 'asd'

@item_blueprint.route('/', methods=['POST'])
def submit_item():
    post_data = request.json
    cmd = json.loads(post_data['cmds'][0]['cmd'])
    item_data = cmd['payload']['exec']['data']
    
    # check hash
    if not check_hash(item_data['cells'], item_data['id']):
        return 'hash error'
    else:
        app.logger.debug('hash pass')

    # create image
    generate_image_from_item(item_data)

    url = '{}/api/v1/send'.format(app.config['PACT_URL'])
    try:
        res = requests.post(url, json=post_data)
        request_key_data = res.json()
        request_key = request_key_data['requestKeys'][0]

        time.sleep(1)

        url = '{}/api/v1/poll'.format(app.config['PACT_URL'])
        res = requests.post(url, json=request_key_data)
        result = res.json()[request_key]['result']
    
        app.logger.debug(result)
        
        if result['status'] == 'success':
            return 'success'
        else:
            return ''
    except Exception as e:
        app.logger.error(e)
        return 'network error'