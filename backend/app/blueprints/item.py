from flask import Blueprint, request, current_app as app, jsonify
import json

from app import db
from app.models.item import Item
from app.models.ledger import Ledger

from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash
from app.utils.pact import send_req
from app.utils.response import get_error_response, get_success_response
from app.utils.security import login_required, validate_account

item_blueprint = Blueprint('item', __name__)

@item_blueprint.route('/<item_id>', methods=['GET'])
def get_item(item_id):
    item = db.session.query(Item).filter(Item.id == item_id).first()
    return jsonify(item)

@item_blueprint.route('/owned-by/<user_id>')
def get_items_owned_by_user(user_id):
    items = db.session.query(Ledger).filter(Ledger.user_id == user_id).all()
    return jsonify(items)

@item_blueprint.route('/created-by/<user_id>')
def get_items_created_by_user(user_id):
    items = db.session.query(Item).filter(Item.creator == user_id).all()
    return jsonify(items)

@item_blueprint.route('/all')
def get_all_items():
    items = Item.query.all()
    return jsonify(items)

@login_required
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

    # validate account
    user_valid_result = validate_account(item_data['account'])
    if user_valid_result['status'] != 'success':
        return user_valid_result

    # validate item
    item_valid_result = validate_item(item_data)
    if item_valid_result['status'] != 'success':
        return item_valid_result

    # create image
    try:
        generate_image_from_item(item_data)
    except Exception as e:
        app.logger.exception(e)
        return get_error_response('generage image error: {}'.format(e))

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
            supply=item_data['supply']
        )
        db.session.add(item)
        db.session.commit()

        ledger = Ledger(
            id='{}:{}'.format(item_data['id'], item_data['account']),
            item_id=item_data['id'],
            user_id=item_data['account'],
            balance=item_data['supply']
        )
        db.session.add(ledger)
        db.session.commit()

    return result

def validate_item(item):
    # validate supply
    if item['supply'] < app.config['ITEM_MIN_SUPPLY'] or item['supply'] > app.config['ITEM_MAX_SUPPLY']:
        return get_error_response('supply is not correct')
    
    # validate hash
    if not check_hash(item['cells'], item['id']):
        return get_error_response('hash error')

    # check duplication
    db_item = db.session.query(Item).filter(Item.id == item['id']).first()
    app.logger.debug('item in db: {}'.format(db_item))
    if db_item:
        return get_error_response('item has already been minted')

    return get_success_response('success')