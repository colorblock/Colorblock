from flask import Blueprint, request, session, current_app as app, jsonify
import cloudinary.uploader
import boto3
import json

from app import db
from app.blueprints.tool import get_image_type
from app.models.collectible import Collectible
from app.models.collection import Collection
from app.models.item import Item
from app.models.asset import Asset
from app.models.mint import Mint
from app.models.release import Release
from app.models.recall import Recall
from app.models.purchase import Purchase

from app.blueprints.admin.routine import update_item, update_asset
from app.utils.pact_lang_api import fetch_listen, mk_cap, mk_meta, prepare_exec_cmd, send_signed, sign, verify
from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash, hash_id
from app.utils.pact import get_accounts, get_module_names, send_req
from app.utils.tools import current_timestamp, current_utc_string, jsonify_data
from app.utils.response import get_error_response, get_success_response
from app.utils.security import get_current_public_key, get_current_user, login_required, validate_account

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
    asset_id = '{}:{}'.format(item_id, user_id)
    asset = db.session.query(Asset).filter(Asset.id == asset_id).first()
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

@item_blueprint.route('/prepare', methods=['POST'])
@login_required
def prepare_item():
    post_data = request.json
    env_data = post_data['envData']
    item_id = env_data['id']
    user_id = get_current_user()
    public_key = get_current_public_key()
    
    modules = get_module_names()
    accounts = get_accounts()
    verifier_account = accounts['verifier']
    
    item_valid_result = validate_item(env_data)
    if item_valid_result['status'] != 'success':
        return item_valid_result
    
    # create image
    try:
        file_path = generate_image_from_item(env_data)
        file_name = file_path.split('/')[-1]
    except Exception as e:
        app.logger.exception(e)
        return get_error_response('generage image error: {}'.format(e))

    # upload image
    upload_result = cloudinary.uploader.upload(file_path, public_id=item_id)
    app.logger.debug('upload result: {}'.format(upload_result))
    cloudinary_url = upload_result['secure_url']
    cloudfront_url = '{}/{}'.format(app.config['CLOUDFRONT_HOST'], file_name)
    urls = [cloudfront_url, cloudinary_url]
    # add into env_data
    env_data['urls'] = urls
    env_data['verifier'] = verifier_account

    pact_code = '({}.create-item-with-verifier "{}" (read-msg "title") (read-msg "colors") (read-integer "rows") (read-integer "cols") (read-integer "frames") (read-msg "intervals") "{}" (read-decimal "supply") (read-msg "urls") "{}")'.format(modules['colorblock'], item_id, user_id, verifier_account)
    key_pairs = [{
        'public_key': app.config['VERIFIER']['public_key'],
        'secret_key': app.config['VERIFIER']['secret_key'],
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('mint', 'mint item', '{}.MINT'.format(modules['colorblock']), [item_id, user_id, env_data['supply']])['cap'],
        ]
    }, {
        'public_key': public_key,
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('mint', 'mint item', '{}.MINT'.format(modules['colorblock']), [item_id, user_id, env_data['supply']])['cap'],
        ]
    }]
    if post_data['onSale']:
        pact_code += '({}.release "{}" "{}" (read-decimal "price") (read-decimal "amount"))'.format(modules['colorblock_market'], item_id, user_id)
        for key_pair in key_pairs:
            cap = mk_cap('release', 'release item', '{}.TRANSFER'.format(modules['colorblock-market']), [item_id, user_id, accounts['market-pool'], env_data['amount']])['cap']
            key_pair['clist'].append(cap)

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd, {}'.format(partial_signed_cmd))

    return get_success_response(partial_signed_cmd)

@item_blueprint.route('/', methods=['POST'])
@login_required
def submit_item():
    post_data = request.json
    signed_cmd = post_data['signedCmd']

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    item_data = cmd['payload']['exec']['data']

    # submit item to pact server
    result = send_signed(signed_cmd, app.config['API_HOST'])
    
    if isinstance(result, dict):
        listen_cmd = {
            'listen': result['requestKeys'][0]
        }
        app.logger.debug('now listen to: {}'.format(listen_cmd))
        result = fetch_listen(listen_cmd, app.config['API_HOST'])['result']
        print(result)
        app.logger.debug('result = {}'.format(result))
        if result['status'] == 'success':
            # upload to s3
            try:
                s3_client = boto3.client('s3')
                object_name = '{}.{}'.format(item_data['id'], get_image_type(item_data['frames']))
                file_name = 'app/static/img/{}'.format(object_name)
                response = s3_client.upload_file(file_name, app.config['S3_BUCKET'], object_name)
                app.logger.debug(response)
            except Exception as e:
                app.logger.error(e)
                return get_error_response(str(e))

            item_id = item_data['id']
            item_info = {
                'tags': post_data['tags'],
                'description': post_data['description'],
            }
            update_item(item_id, item_info)
            asset_id = '{}:{}'.format(item_data['id'], item_data['account'])
            update_asset(asset_id)
            
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
                
            result['itemId'] = item_data['id']
            return get_success_response(result)
        else:
            return get_error_response(result['error'])
    else:
        return get_error_response(result)

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