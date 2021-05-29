from flask import Blueprint, request, current_app as app, jsonify
import json

from app import db
from app.models.item import Item

from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash
from app.utils.pact import send_req

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
    app.logger.debug('post_data: {}'.format(post_data))

    # add item type, strip supply
    cmd = json.loads(post_data['cmds'][0]['cmd'])
    item_data = cmd['payload']['exec']['data']
    item_data['type'] = 0 if item_data['frames'] == 1 else 1  # just 1 frame -> static -> type 0
    item_data['supply'] = int(item_data['supply'])
    app.logger.debug('item_data: {}'.format(item_data))

    # validate hash
    if not check_hash(item_data['cells'], item_data['id']):
        return 'hash error'

    # create image
    generate_image_from_item(item_data)

    # submit item to pact server
    result = send_req(post_data)
        
    if result['status'] == 'success':
        item = Item(
            id=item_data['id'],
            title=item_data['title'],
            type=item_data['type'],
            tags=','.join(item_data['tags']), 
            description=item_data['description'],
            creator=item_data['account'],
            supply=item_data['supply'],
            tx_id=result['tx_id']
        )
        db.session.add(item)
        db.session.commit()
    
    return result