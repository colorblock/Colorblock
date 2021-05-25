from flask import Blueprint, request, current_app as app, jsonify
import requests
import json
import time

from app import db
from app.models.item import Item

from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash

item_blueprint = Blueprint('item', __name__)

@item_blueprint.route('/<item_id>', methods=['GET'])
def get_item(item_id):
    item = db.session.query(Item).filter(Item.id == item_id).one()
    return jsonify(item)

@item_blueprint.route('/all', methods=['GET'])
def get_all_items():
    items = Item.query.all()
    app.logger.debug(items)
    return str(items)

@item_blueprint.route('/', methods=['POST'])
def submit_item():
    post_data = request.json
    cmd = json.loads(post_data['cmds'][0]['cmd'])
    item_data = cmd['payload']['exec']['data']

    app.logger.debug(post_data)
    
    # validate hash
    if not check_hash(item_data['cells'], item_data['id']):
        return 'hash error'

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
        
        if result['status'] == 'success':
            item = Item(
                id=item_data['id'],
                title=item_data['title'],
                tags=','.join(item_data['tags']), 
                description=item_data['description'],
                creator=item_data['account'],
                owner=item_data['account']
            )
            db.session.add(item)
            db.session.commit()
            return 'success'
        else:
            return 'failure'
    except Exception as e:
        app.logger.error(e)
        return 'network error'