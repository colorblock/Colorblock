from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.blueprints.admin.routine import update_deal, update_asset
from app.models.deal import Deal
from app.models.item import Item
from app.models.asset import Asset
from app.models.purchase import Purchase
from app.models.sale import Sale
from app.utils.chainweb import truncate_precision
from app.utils.pact_lang_api import fetch_listen, mk_cap, mk_meta, prepare_exec_cmd, send_signed
from app.utils.response import get_error_response, get_success_response
from app.utils.security import get_current_public_key, get_current_user, login_required
from app.utils.tools import current_timestamp, current_utc_string, jsonify_data
from app.utils.pact import get_accounts, get_module_names, send_req
from app.utils.crypto import hash_id

asset_blueprint = Blueprint('asset', __name__)

@asset_blueprint.route('/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = db.session.query(Asset).filter(Asset.id == asset_id).first()
    if asset:
        asset = jsonify_data(asset)
        item = db.session.query(Item).filter(Item.id == asset['item_id']).first()
        item = jsonify_data(item)
        asset['item'] = item
        sale = db.session.query(Sale).filter(Sale.item_id == item['id'], Sale.user_id == asset['user_id']).first()
        sale = jsonify_data(sale)
        asset['sale'] = sale
    return jsonify(asset)

@asset_blueprint.route('/owned-by/<user_id>', methods=['GET'])
def get_assets_owned_by_user(user_id):
    assets = db.session.query(Asset).filter(Asset.user_id == user_id).all()
    if len(assets) > 0:
        assets = jsonify_data(assets)
        item_ids = [v['item_id'] for v in assets]
        items = db.session.query(Item).filter(Item.id.in_(item_ids)).all()
        for asset in assets:
            asset_id = asset['id']
            item_id = asset['item_id']
            item = [v for v in items if v.id == item_id][0]
            item = jsonify_data(item)
            sale = db.session.query(Sale).filter(Sale.id == asset_id).first()
            asset['item'] = item
            if sale:
                asset['sale'] = sale
    return jsonify(assets)

@asset_blueprint.route('/of-item/<item_id>', methods=['GET'])
def get_assets_of_item(item_id):
    assets = db.session.query(Asset).filter(Asset.item_id == item_id).all()
    if len(assets) > 0:
        assets = jsonify_data(assets)
        for asset in assets:
            asset_id = asset['id']
            user_id = asset['user_id']
            sale = db.session.query(Sale).filter(Sale.item_id == item_id, Sale.user_id == user_id).first()
            if sale:
                asset['sale'] = sale
    return jsonify(assets)

@asset_blueprint.route('/latest')
def get_latest_assets():
    purchases = db.session.query(Purchase).order_by(Purchase.created_at.desc()).limit(50).all()
    deals = db.session.query(Deal).order_by(Deal.created_at.desc()).limit(50).all()
    purchase_ids = ['{}:{}'.format(v.item_id, v.seller) for v in purchases]
    deal_ids = ['{}:{}'.format(v.item_id, v.user_id) for v in deals]
    asset_ids = purchase_ids + deal_ids
    assets = []
    item_ids = []
    count = 0
    for asset_id in asset_ids:
        asset = db.session.query(Asset).filter(Asset.id == asset_id).first()
        deal = db.session.query(Deal).filter(Deal.id == asset_id).first()
        if asset and deal and deal.remain > 0:
            asset = jsonify_data(asset)
            item = db.session.query(Item).filter(Item.id == asset['item_id']).first()
            item = jsonify_data(item)
            deal = jsonify_data(deal)
            if item['id'] not in item_ids:
                # avoid duplication
                asset['item'] = item
                asset['deal'] = deal
                assets.append(asset)
                item_ids.append(item['id'])
                count += 1
                if count >= 20:
                    break

    return jsonify(assets)

@asset_blueprint.route('/on_sale/<item_id>')
def get_on_sale_assets(item_id):
    item = db.session.query(Item).filter(Item.id == item_id).first()
    assets = []
    count = 0
    if item:
        item = jsonify_data(item)
        deals = db.session.query(Deal).filter(Deal.item_id == item_id, Deal.open == True).limit(10).all()
        for deal in deals:
            if deal.remain > 0:
                user_id = deal.user_id
                asset_id = '{}:{}'.format(item_id, user_id)
                asset = db.session.query(Asset).filter(Asset.id == asset_id).first()
                if asset:
                    asset = jsonify_data(asset)
                    deal = jsonify_data(deal)
                    # avoid duplication
                    asset['item'] = item
                    asset['deal'] = deal
                    assets.append(asset)
                    count += 1
                    if count >= 20:
                        break

    return jsonify(assets)

@asset_blueprint.route('/release/prepare', methods=['POST'])
@login_required
def prepare_release():
    post_data = request.json
    env_data = post_data['envData']
    item_id = env_data['id']
    user_id = get_current_user()
    public_key = get_current_public_key()

    modules = get_module_names()
    accounts = get_accounts()

    item = db.session.query(Item).filter(Item.id == item_id).first()

    pact_code = '({}.deposit-item "{}" "{}" (read-decimal "amount"))'.format(modules['colorblock-market'], item_id, user_id)
    key_pairs = [{
        'public_key': app.config['MANAGER']['public_key'],
        'secret_key': app.config['MANAGER']['secret_key'],
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('transfer', 'transfer item', '{}.TRANSFER'.format(modules['colorblock']), [item_id, user_id, accounts['market-pool'], env_data['amount']])['cap'],
            mk_cap('deposit', 'deposit item', '{}.DEPOSIT-ITEM'.format(modules['colorblock-market']), [item_id, user_id, env_data['amount']])['cap'],
        ]
    }, {
        'public_key': public_key,
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('transfer', 'transfer item', '{}.TRANSFER'.format(modules['colorblock']), [item_id, user_id, accounts['market-pool'], env_data['amount']])['cap'],
            mk_cap('deposit', 'deposit item', '{}.DEPOSIT-ITEM'.format(modules['colorblock-market']), [item_id, user_id, env_data['amount']])['cap'],
        ]
    }]

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd, {}'.format(partial_signed_cmd))

    partial_signed_cmd['itemUrls'] = item.urls
    return get_success_response(partial_signed_cmd)

@asset_blueprint.route('/release', methods=['POST'])
@login_required
def release_asset():
    post_data = request.json
    signed_cmd = post_data['signedCmd']
    user_id = get_current_user()

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    asset_data = cmd['payload']['exec']['data']

    item_id = asset_data['id']
    combined_asset_id = '{}:{}'.format(item_id, user_id)

    # validate sale status
    sale_id = combined_asset_id
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()

    if sale and sale.status == 'open':
        return get_error_response('You have an existing sale')

    # submit item to pact server
    result = send_signed(signed_cmd, app.config['API_HOST'])

    if isinstance(result, dict):
        listen_cmd = {
            'listen': result['requestKeys'][0]
        }
        app.logger.debug('now listen to: {}'.format(listen_cmd))
        result = fetch_listen(listen_cmd, app.config['API_HOST'])['result']
        app.logger.debug('result = {}'.format(result))
        
        if result['status'] == 'success':
            try:
                update_asset(combined_asset_id)

                sale = Sale(
                    id=sale_id,
                    item_id=item_id,
                    user_id=user_id,
                    price=asset_data['price'],
                    total=asset_data['amount'],
                    remaining=asset_data['amount'],
                    status='open'
                )
                db.session.add(sale)
                db.session.commit()
                    
                app.logger.debug('return message: {}'.format(result))
                return get_success_response(result)
            except Exception as e:
                app.logger.error(e)
                return get_error_response(str(e))
        else:
            app.logger.debug('return message: {}'.format(result['error']['message']))
            return get_error_response(result['error']['message'])
    else:
        return get_error_response(result)

@asset_blueprint.route('/recall/prepare', methods=['POST'])
@login_required
def prepare_recall():
    post_data = request.json
    env_data = post_data['envData']
    item_id = env_data['id']
    user_id = get_current_user()
    public_key = get_current_public_key()

    modules = get_module_names()
    accounts = get_accounts()

    item = db.session.query(Item).filter(Item.id == item_id).first()
    sale = db.session.query(Sale).filter(Sale.item_id == item_id, Sale.user_id == user_id).first()

    if not sale:
        return get_error_response('Please create a sale first')
    elif sale.status != 'open':
        return get_error_response('Sale status is not open')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')

    pact_code = '({}.withdrawl-item "{}" "{}" (read-decimal "amount"))'.format(modules['colorblock-market'], item_id, user_id)
    key_pairs = [{
        'public_key': app.config['MANAGER']['public_key'],
        'secret_key': app.config['MANAGER']['secret_key'],
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('withdrawl', 'withdrawl item', '{}.WITHDRAWL-ITEM'.format(modules['colorblock-market']), [item_id, user_id, sale.remaining])['cap'],
        ]
    }, {
        'public_key': public_key,
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('withdrawl', 'withdrawl item', '{}.WITHDRAWL-ITEM'.format(modules['colorblock-market']), [item_id, user_id, sale.remaining])['cap'],
        ]
    }]

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd, {}'.format(partial_signed_cmd))

    partial_signed_cmd['itemUrls'] = item.urls
    return get_success_response(partial_signed_cmd)

@asset_blueprint.route('/recall', methods=['POST'])
@login_required
def recall_asset():
    post_data = request.json
    signed_cmd = post_data['signedCmd']
    user_id = get_current_user()

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    asset_data = cmd['payload']['exec']['data']

    item_id = asset_data['id']
    combined_asset_id = '{}:{}'.format(item_id, user_id)

    # validate sale status
    sale_id = combined_asset_id
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        return get_error_response('Please create a sale first')
    elif sale.status != 'open':
        return get_error_response('Sale status is not open')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')

    # submit item to pact server
    result = send_signed(signed_cmd, app.config['API_HOST'])

    if isinstance(result, dict):
        listen_cmd = {
            'listen': result['requestKeys'][0]
        }
        app.logger.debug('now listen to: {}'.format(listen_cmd))
        result = fetch_listen(listen_cmd, app.config['API_HOST'])['result']
        app.logger.debug('result = {}'.format(result))
        
        if result['status'] == 'success':
            try:
                update_asset(combined_asset_id)

                sale.total = 0
                sale.remaining = 0
                sale.status = 'canceled'
                db.session.commit()
                    
                app.logger.debug('return message: {}'.format(result))
                return get_success_response(result)
            except Exception as e:
                app.logger.error(e)
                return get_error_response(str(e))
        else:
            app.logger.debug('return message: {}'.format(result['error']['message']))
            return get_error_response(result['error']['message'])
    else:
        return get_error_response(result)


@asset_blueprint.route('/purchase/prepare', methods=['POST'])
@login_required
def prepare_purchase():
    post_data = request.json
    env_data = post_data['envData']
    item_id = env_data['id']
    user_id = get_current_user()
    public_key = get_current_public_key()

    modules = get_module_names()
    accounts = get_accounts()

    item = db.session.query(Item).filter(Item.id == item_id).first()
    sale = db.session.query(Sale).filter(Sale.id == post_data['saleId']).first()
    sale_price = sale.price
    purchase_amount = env_data['amount']

    if not sale:
        return get_error_response('Sale is not existed')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')
    elif sale.status == 'open':
        return get_error_response('Sale status is not open')

    payment = truncate_precision(purchase_amount * sale_price)
    fees = truncate_precision(payment * app.config['COLORBLOCK_MARKET_FEES'])

    pact_code = '({}.purcahse "{}" "{}" "{}" (read-decimal "amount"))'.format(modules['colorblock-market'], item_id, user_id, sale.user_id, purchase_amount, payment, fees)
    key_pairs = [{
        'public_key': app.config['MANAGER']['public_key'],
        'secret_key': app.config['MANAGER']['secret_key'],
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('purchase', 'purchase item', '{}.PURCHASE'.format(modules['colorblock-market']), [item_id, user_id, sale.user_id, purchase_amount, payment, fees])['cap'],
        ]
    }, {
        'public_key': public_key,
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('purchase', 'purchase item', '{}.PURCHASE'.format(modules['colorblock-market']), [item_id, user_id, sale.user_id, purchase_amount, payment, fees])['cap'],
        ]
    }]

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd, {}'.format(partial_signed_cmd))

    partial_signed_cmd['itemUrls'] = item.urls
    return get_success_response(partial_signed_cmd)

@asset_blueprint.route('/purchase', methods=['POST'])
@login_required
def purchase_asset():
    post_data = request.json
    signed_cmd = post_data['signedCmd']
    user_id = get_current_user()

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    asset_data = cmd['payload']['exec']['data']

    item_id = asset_data['id']
    combined_asset_id = '{}:{}'.format(item_id, user_id)

    # validate sale status
    item = db.session.query(Item).filter(Item.id == item_id).first()
    sale = db.session.query(Sale).filter(Sale.id == post_data['saleId']).first()
    sale_price = sale.price
    purchase_amount = asset_data['amount']

    if not sale:
        return get_error_response('Sale is not existed')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')
    elif sale.status == 'open':
        return get_error_response('Sale status is not open')

    # submit item to pact server
    result = send_signed(signed_cmd, app.config['API_HOST'])

    if isinstance(result, dict):
        listen_cmd = {
            'listen': result['requestKeys'][0]
        }
        app.logger.debug('now listen to: {}'.format(listen_cmd))
        result = fetch_listen(listen_cmd, app.config['API_HOST'])['result']
        app.logger.debug('result = {}'.format(result))
        
        if result['status'] == 'success':
            try:
                update_asset(combined_asset_id)

                sale.remaining = sale.remaining - purchase_amount
                if (sale.remaining == 0):
                    sale.status = 'closed'
                else:
                    sale.status = 'canceled'
                db.session.commit()
                    
                app.logger.debug('return message: {}'.format(result))
                return get_success_response(result)
            except Exception as e:
                app.logger.error(e)
                return get_error_response(str(e))
        else:
            app.logger.debug('return message: {}'.format(result['error']['message']))
            return get_error_response(result['error']['message'])
    else:
        return get_error_response(result)

