from flask import Blueprint, request, session, current_app as app, jsonify
import cloudinary.uploader
import boto3
import json
import copy

from app import db
from app.blueprints.tool import get_image_type
from app.models.collectible import Collectible
from app.models.collection import Collection
from app.models.item import Item
from app.models.asset import Asset
from app.models.mint import Mint
from app.models.sale import Sale
from app.models.release import Release
from app.models.recall import Recall
from app.models.purchase import Purchase

from app.blueprints.admin.routine import update_item, update_asset
from app.utils.chainweb import combined_id
from app.utils.pact_lang_api import fetch_listen, mk_cap, mk_meta, prepare_exec_cmd, send_signed, sign, verify
from app.utils.render import generate_image_from_item
from app.utils.crypto import check_hash, hash_id, random
from app.utils.pact import get_accounts, get_module_names, send_req
from app.utils.tools import current_timestamp, current_utc_string, dt_from_ts, jsonify_data
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

@item_blueprint.route('/trending')
def get_trending_items():
    items = db.session.query(Item).order_by(Item.supply).limit(20).all()
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
    app.logger.debug('Execute mint for {}'.format(str(post_data)[:300]))
    
    env_data = post_data['envData']
    item_id = env_data['itemId']
    user_id = get_current_user()
    public_key = get_current_public_key()
    
    modules = get_module_names()
    accounts = get_accounts()
    verifier_account = accounts['verifier']
    
    # validate item
    item_valid_result = validate_item(env_data)
    if item_valid_result['status'] != 'success':
        return item_valid_result
    
    # create image
    try:
        file_path = generate_image_from_item(env_data)
        file_name = file_path.split('/')[-1]
    except Exception as e:
        # return error message if generate image failed
        app.logger.exception(e)
        return get_error_response('generage image error: {}'.format(e))

    # upload image
    try:
        upload_result = cloudinary.uploader.upload(file_path, public_id=item_id)
        cloudinary_url = upload_result['secure_url']
    except Exception as e:
        # return error message if upload image failed
        app.logger.exception(e)
        return get_error_response('upload image error: {}'.format(e))

    # add into env_data
    cloudfront_url = '{}/{}'.format(app.config['CLOUDFRONT_HOST'], file_name)
    urls = [cloudfront_url, cloudinary_url]
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
        'public_key': app.config['MANAGER']['public_key'],
        'secret_key': app.config['MANAGER']['secret_key'],
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('mint', 'mint item', '{}.MINT'.format(modules['colorblock']), [item_id, user_id, env_data['supply']])['cap'],
        ]
    }, {
        'public_key': public_key,
        'public_key': public_key,
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('mint', 'mint item', '{}.MINT'.format(modules['colorblock']), [item_id, user_id, env_data['supply']])['cap'],
        ]
    }]
    if post_data['onSale']:
        pact_code += '({}.deposit-item "{}" "{}" (read-decimal "saleAmount"))'.format(modules['colorblock-market'], item_id, user_id)
        for key_pair in key_pairs:
            cap1 = mk_cap('transfer', 'transfer item', '{}.TRANSFER'.format(modules['colorblock']), [item_id, user_id, accounts['market-pool'], env_data['saleAmount']])['cap']
            cap2 = mk_cap('deposit', 'deposit item', '{}.DEPOSIT-ITEM'.format(modules['colorblock-market']), [item_id, user_id, env_data['saleAmount']])['cap']
            key_pair['clist'].append(cap1)
            key_pair['clist'].append(cap2)
    else:
        key_pairs = key_pairs[:1] + key_pairs[2:]  # remove manager

    env_data['itemId'] = item_id
    env_data['userId'] = user_id

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd finished')

    partial_signed_cmd['itemUrls'] = urls
    return get_success_response(partial_signed_cmd)

@item_blueprint.route('/', methods=['POST'])
@login_required
def submit_item():
    post_data = request.json
    app.logger.debug('Execute mint for {}'.format(str(post_data)[:300]))

    signed_cmd = post_data['signedCmd']

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    item_data = cmd['payload']['exec']['data']

    # tx info
    item_id = item_data['itemId']
    user_id = item_data['userId']
    amount = item_data['supply']

    # submit item to pact server
    result = send_signed(signed_cmd, app.config['API_HOST'])
    app.logger.debug('send result = {}'.format(result))
    if not isinstance(result, dict):
        # return error message if CMD sending occurs error
        app.logger.debug('SEND error', result)
        return get_error_response(result)

    # fetch result from pact server
    listen_cmd = {
        'listen': result['requestKeys'][0]
    }
    result = fetch_listen(listen_cmd, app.config['API_HOST'])
    app.logger.debug('listen result = {}'.format(result))
    if not isinstance(result, dict):
        # return error message if CMD listening occurs error
        app.logger.debug('LISTEN error', result)
        return get_error_response(result)

    # record mint action
    try:
        app.logger.debug('now update mint for {}, {}'.format(item_id, user_id))
        mint_id = random()
        mint = Mint(
            id=mint_id,
            chain_id=app.config['CHAINWEB']['CHAIN_ID'],
            block_height=result['metaData']['blockHeight'],
            block_hash=result['metaData']['blockHash'],
            block_time=dt_from_ts(result['metaData']['blockTime']),
            tx_id=result['txId'],
            tx_hash=result['reqKey'],
            tx_status=result['result']['status'],
            item_id=item_id,
            user_id=user_id,
            supply=amount
        )
        db.session.add(mint)
        db.session.commit()
    except Exception as e:
        app.logger.exception(e)
    
    # unpack result and record
    result = result['result']
    if result['status'] != 'success':
        error_msg = result['error']['message']
        # return error message if CMD failed
        app.logger.debug('CMD execution failed', result)
        return get_error_response(error_msg)

    # upload to s3
    try:
        app.logger.debug('now upload mint for {}, {}'.format(item_id, user_id))
        s3_client = boto3.client('s3')
        object_name = '{}.{}'.format(item_data['itemId'], get_image_type(item_data['frames']))
        file_name = 'app/static/img/{}'.format(object_name)
        response = s3_client.upload_file(file_name, app.config['CLOUDFRONT_BUCKET'], object_name)
        app.logger.debug(response)
    except Exception as e:
        app.logger.exception(e)

    # create item
    try:
        app.logger.debug('now update item for {}, {}'.format(item_id, user_id))
        item_info = {}
        if 'tags' in post_data:
            item_info['tags'] = post_data['tags']
        if 'description' in post_data:
            item_info['description'] = post_data['description']
        update_item(item_id)

    except Exception as e:
        app.logger.exception(e)

    # update asset
    try:
        app.logger.debug('now update asset for {}, {}'.format(item_id, user_id))
        update_asset(item_id, user_id)
    except Exception as e:
        app.logger.exception(e)
 
    # update collection
    try:
        app.logger.debug('now update collection for {}, {}'.format(item_id, user_id))
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
        else:
            app.logger.debug('no specific collection')

    except Exception as e:
        app.logger.exception(e)

    # update sale
    try:
        app.logger.debug('now update sale for {}, {}'.format(item_id, user_id))
        if post_data.get('onSale'):
            sale_id = combined_id(item_id, user_id)
            price = post_data['price']
            amount = item_data['saleAmount']
            sale = Sale(
                id=sale_id,
                item_id=item_id,
                user_id=user_id,
                price=price,
                total=amount,
                remaining=amount,
                status='open'
            )
            db.session.add(sale)
            db.session.commit()

    except Exception as e:
        app.logger.exception(e)

    result['itemId'] = item_data['itemId']
    return get_error_response(result)

def validate_item(item):
    # validate description
    if len(item.get('description', '')) > app.config['ITEM_MAX_DESCRIPTION_LENGTH']:
        return get_error_response('the length of description is too large')
    
    # validate hash
    item_id = item['itemId']
    if not check_hash(item['colors'], item_id):
        return get_error_response('hash error')

    # check duplication
    db_item = db.session.query(Item).filter(Item.id == item_id).first()
    if db_item:
        return get_error_response('item has already been minted')

    return get_success_response('success')
