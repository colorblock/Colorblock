from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.models.collectible import Collectible
from app.models.collection import Collection
from app.models.item import Item
from app.models.ledger import Ledger
from app.models.mint import Mint
from app.models.release import Release
from app.models.recall import Recall
from app.models.purchase import Purchase

from app.blueprints.admin.routine import update_item, update_ledger
from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash, hash_id
from app.utils.pact import send_req
from app.utils.tools import jsonify_data
from app.utils.response import get_error_response, get_success_response
from app.utils.security import login_required, validate_account

item_blueprint = Blueprint('item', __name__)

@item_blueprint.route('/<item_id>', methods=['GET'])
def get_item(item_id):
    item = db.session.query(Item).filter(Item.id == item_id).first()
    return jsonify(item)

@item_blueprint.route('/created-by/<user_id>')
def get_items_created_by_user(user_id):
    items = db.session.query(Item).filter(Item.creator == user_id).all()
    return jsonify(items)

@item_blueprint.route('/latest')
def get_latest_items():
    items = db.session.query(Item).order_by(Item.created_at.desc()).limit(20).all()
    if len(items) > 0:
        items = jsonify_data(items)
        for item in items:
            item_id = item['id']
            mint = db.session.query(Mint).filter(Mint.item_id == item_id).first()
            if mint:
                mint = jsonify_data(mint)
                item['mint'] = mint

    return jsonify(items)

@item_blueprint.route('/<item_id>/is-owned-by/<user_id>', methods=['GET'])
def get_item_is_owned_by(item_id, user_id):
    ledger_id = '{}:{}'.format(item_id, user_id)
    asset = db.session.query(Ledger).filter(Ledger.id == ledger_id).first()
    result = {
        'result': True if asset else False
    }
    return jsonify(result)

@item_blueprint.route('/count')
def get_items_count():
    count = db.session.query(Item).count()
    data = {
        'count': count
    }
    return data

@item_blueprint.route('/<item_id>/log', methods=['GET'])
def get_item_log(item_id):
    log = {}
    mint = db.session.query(Mint).filter(Mint.item_id == item_id).first()
    log['mint'] = jsonify_data(mint)
    releases = db.session.query(Release).filter(Release.item_id == item_id).all()
    log['releases'] = jsonify_data(releases)
    recalls = db.session.query(Recall).filter(Recall.item_id == item_id).all()
    log['recalls'] = jsonify_data(recalls)
    purchases = db.session.query(Purchase).filter(Purchase.item_id == item_id).all()
    log['purchases'] = jsonify_data(purchases)
    return jsonify(log)

@item_blueprint.route('/', methods=['POST'])
@login_required
def submit_item():
    post_data = request.json

    # add item type, strip supply
    cmd = json.loads(post_data['cmds'][0]['cmd'])
    item_data = cmd['payload']['exec']['data']
    item_data['type'] = 0 if item_data['frames'] == 1 else 1  # just 1 frame -> static -> type 0
    item_data['supply'] = int(item_data['supply'])
    app.logger.debug('item_data: {}'.format([v for k, v in item_data.items() if k != 'colors']))

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
        item_id = item_data['id']
        item_info = {
            'tags': post_data['tags'],
            'description': post_data['description'],
        }
        update_item(item_id, item_info)
        ledger_id = '{}:{}'.format(item_data['id'], item_data['account'])
        update_ledger(ledger_id)
        
        if post_data.get('collection'):
            # update collectible
            collection = post_data['collection']
            collection_id = collection['id']
            collectible_id = hash_id('{}:{}'.format(item_id, collection_id))
            collectible = Collectible(
                id=collectible_id,
                item_id=item_id,
                collection_id=collection_id
            )
            db.session.add(collectible)
            db.session.commit()

            collection_db = db.session.query(Collection).filter(Collection.id == collection_id).first()
            if not collection_db:
                collection = Collection(
                    id=collection_id,
                    title=collection['title'],
                    user_id=collection['user_id'],
                )
                db.session.add(collection)
                db.session.commit()
            
    return result

def validate_item(item):
    # validate description
    if len(item.get('description', '')) > app.config['ITEM_MAX_DESCRIPTION_LENGTH']:
        return get_error_response('the length of description is too large')
    
    # validate hash
    if not check_hash(item['colors'], item['id']):
        return get_error_response('hash error')

    # check duplication
    db_item = db.session.query(Item).filter(Item.id == item['id']).first()
    app.logger.debug('item in db: {}'.format(db_item))
    if db_item:
        return get_error_response('item has already been minted')

    return get_success_response('success')