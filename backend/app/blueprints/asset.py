from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.blueprints.admin.routine import update_deal, update_asset
from app.models.deal import Deal
from app.models.item import Item
from app.models.asset import Asset
from app.models.purchase import Purchase
from app.models.recall import Recall
from app.models.release import Release
from app.models.sale import Sale
from app.utils.chainweb import combined_id, truncate_precision
from app.utils.pact_lang_api import fetch_listen, mk_cap, mk_meta, prepare_exec_cmd, send_signed
from app.utils.response import get_error_response, get_success_response
from app.utils.security import get_current_public_key, get_current_user, login_required
from app.utils.tools import current_timestamp, current_utc_string, dt_from_ts, jsonify_data
from app.utils.pact import build_local_cmd, get_accounts, get_module_names, local_req, send_req
from app.utils.crypto import hash_id, random

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
            item_id = asset['item_id']
            item = [v for v in items if v.id == item_id][0]
            item = jsonify_data(item)
            sale = db.session.query(Sale).filter(Sale.item_id == item_id, Sale.user_id == user_id).first()
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
    app.logger.debug('prepare release for {}'.format(post_data))

    env_data = post_data['envData']
    item_id = env_data['itemId']
    user_id = get_current_user()
    public_key = get_current_public_key()

    modules = get_module_names()
    accounts = get_accounts()

    # validate item status
    item = db.session.query(Item).filter(Item.id == item_id).first()
    if not item:
        return get_error_response('Item is not existed')

    # validate sale status
    sale_id = combined_id(item_id, user_id)
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()
    if sale and sale.status == 'open':
        return get_error_response('You have an existing sale')

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
    env_data['itemId'] = item_id
    env_data['userId'] = user_id

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
    app.logger.debug('Execute release for {}'.format(post_data))

    signed_cmd = post_data['signedCmd']

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    asset_data = cmd['payload']['exec']['data']

    # tx info
    item_id = asset_data['itemId']
    user_id = asset_data['userId']
    price = asset_data['price']
    amount = asset_data['amount']

    # validate sale status
    sale_id = combined_id(item_id, user_id)
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()
    if sale and sale.status == 'open':
        return get_error_response('You have an existing sale')

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
    for i in range(5):
        try:
            result = fetch_listen(listen_cmd, app.config['API_HOST'])
            app.logger.debug('listen result = {}'.format(result))
            if not isinstance(result, dict):
                # return error message if CMD listening occurs error
                app.logger.debug('LISTEN error', result)
                return get_error_response(result)

            break
        except:
            app.logger.debug('retry')

    # record release action
    try:
        app.logger.debug('now update release for {}, {}'.format(item_id, user_id))
        release_id = random()
        release = Release(
            id=release_id,
            chain_id=app.config['CHAINWEB']['CHAIN_ID'],
            block_height=result['metaData']['blockHeight'],
            block_hash=result['metaData']['blockHash'],
            block_time=dt_from_ts(result['metaData']['blockTime']),
            tx_id=result['txId'],
            tx_hash=result['reqKey'],
            tx_status=result['result']['status'],
            item_id=item_id,
            seller=user_id,
            price=price,
            amount=amount
        )
        db.session.add(release)
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

    # update asset
    try:
        app.logger.debug('now update asset for {}, {}'.format(item_id, user_id))
        update_asset(item_id, user_id)
    except Exception as e:
        app.logger.exception(e)

    # update sale
    try:
        app.logger.debug('now update sale for {}, {}'.format(item_id, user_id))
        if not sale:
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
        else:
            sale.price = price
            sale.total = amount
            sale.remaining = amount
            sale.status = 'open'
            db.session.commit()
    except Exception as e:
        app.logger.exception(e)
    
    return get_success_response(result)

@asset_blueprint.route('/recall/prepare', methods=['POST'])
@login_required
def prepare_recall():
    post_data = request.json
    app.logger.debug('Prepare recall for {}'.format(post_data))

    env_data = post_data['envData']
    item_id = env_data['itemId']
    user_id = get_current_user()
    public_key = get_current_public_key()

    modules = get_module_names()
    accounts = get_accounts()

    # validate sale status
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
    env_data['itemId'] = item_id
    env_data['userId'] = user_id

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd, {}'.format(partial_signed_cmd))

    item = db.session.query(Item).filter(Item.id == item_id).first()
    partial_signed_cmd['itemUrls'] = item.urls
    return get_success_response(partial_signed_cmd)

@asset_blueprint.route('/recall', methods=['POST'])
@login_required
def recall_asset():
    post_data = request.json
    app.logger.debug('Execute recall for {}'.format(post_data))

    signed_cmd = post_data['signedCmd']

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    asset_data = cmd['payload']['exec']['data']

    # tx info
    item_id = asset_data['itemId']
    user_id = asset_data['userId']

    # validate sale status
    sale_id = combined_id(item_id, user_id)
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        return get_error_response('Please create a sale first')
    elif sale.status != 'open':
        return get_error_response('Sale status is not open')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')

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
    for i in range(5):
        try:
            result = fetch_listen(listen_cmd, app.config['API_HOST'])
            app.logger.debug('listen result = {}'.format(result))
            if not isinstance(result, dict):
                # return error message if CMD listening occurs error
                app.logger.debug('LISTEN error', result)
                return get_error_response(result)

            break
        except:
            app.logger.debug('retry')

    # record recall action
    try:
        app.logger.debug('now update recall for {}, {}'.format(item_id, user_id))
        recall_id = random()
        recall = Recall(
            id=recall_id,
            chain_id=app.config['CHAINWEB']['CHAIN_ID'],
            block_height=result['metaData']['blockHeight'],
            block_hash=result['metaData']['blockHash'],
            block_time=dt_from_ts(result['metaData']['blockTime']),
            tx_id=result['txId'],
            tx_hash=result['reqKey'],
            tx_status=result['result']['status'],
            item_id=item_id,
            seller=user_id
        )
        db.session.add(recall)
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

    # update asset
    try:
        app.logger.debug('now update asset for {}, {}'.format(item_id, user_id))
        update_asset(item_id, user_id)
    except Exception as e:
        app.logger.exception(e)

    # update sale
    try:
        app.logger.debug('now update sale for {}, {}'.format(item_id, user_id))
        sale.total = 0
        sale.remaining = 0
        sale.status = 'canceled'
        db.session.commit()
    except Exception as e:
        app.logger.exception(e)

    return get_success_response(result)

@asset_blueprint.route('/purchase/prepare', methods=['POST'])
@login_required
def prepare_purchase():
    post_data = request.json
    app.logger.debug('Prepare purchase for {}'.format(post_data))

    env_data = post_data['envData']
    item_id = env_data['itemId']
    user_id = get_current_user()
    public_key = get_current_public_key()

    modules = get_module_names()
    accounts = get_accounts()

    # validate sale status
    sale_id = env_data['saleId']
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        return get_error_response('Sale is not existed')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')
    elif sale.status != 'open':
        return get_error_response('Sale status is not open')
    elif item_id != sale.item_id:
        return get_error_response('Sale item is not matched')

    # validate purchase
    purchase_amount = env_data['amount']
    if purchase_amount > sale.remaining:
        return get_error_response('Purchase amount cannot exceed sale remaining')

    sale_price = sale.price
    seller_id = sale.user_id
    payment = truncate_precision(purchase_amount * sale_price)
    fees = truncate_precision(payment * app.config['COLORBLOCK_MARKET_FEES'])
    pact_code = '({}.purchase "{}" "{}" "{}" (read-decimal "amount") {} {})'.format(modules['colorblock-market'], item_id, user_id, seller_id, payment, fees)
    key_pairs = [{
        'public_key': app.config['MANAGER']['public_key'],
        'secret_key': app.config['MANAGER']['secret_key'],
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('purchase', 'purchase item: transfer payment to seller, transfer fees to pool, credit item to buyer', '{}.PURCHASE'.format(modules['colorblock-market']), [item_id, user_id, seller_id, purchase_amount, payment, fees])['cap'],
        ]
    }, {
        'public_key': public_key,
        'clist': [
            mk_cap('gas', 'pay gas', '{}.GAS_PAYER'.format(modules['colorblock-gas-payer']), ['colorblock-gas', {'int': 1.0}, 1.0])['cap'],
            mk_cap('purchase', 'purchase item: transfer payment to seller, transfer fees to pool, credit item to buyer', '{}.PURCHASE'.format(modules['colorblock-market']), [item_id, user_id, seller_id, purchase_amount, payment, fees])['cap'],
        ]
    }]
    env_data['itemId'] = item_id
    env_data['buyer_id'] = user_id
    env_data['seller_id'] = seller_id
    env_data['price'] = float(sale_price)
    env_data['amount'] = purchase_amount

    chainweb_config = app.config['CHAINWEB']
    meta = mk_meta(accounts['gas-payer'], chainweb_config['CHAIN_ID'], chainweb_config['GAS_PRICE'], chainweb_config['GAS_LIMIT'], current_timestamp(), chainweb_config['TTL'])
    partial_signed_cmd = prepare_exec_cmd(pact_code, env_data, key_pairs, current_utc_string(), meta, chainweb_config['NETWORK_ID'])
    app.logger.debug('partial_signed_cmd, {}'.format(partial_signed_cmd))

    item = db.session.query(Item).filter(Item.id == item_id).first()
    partial_signed_cmd['itemUrls'] = item.urls
    return get_success_response(partial_signed_cmd)

@asset_blueprint.route('/purchase', methods=['POST'])
@login_required
def purchase_asset():
    post_data = request.json
    app.logger.debug('Execute purchase for {}'.format(post_data))

    signed_cmd = post_data['signedCmd']

    # parse cmd
    cmd = json.loads(signed_cmd['cmd'])
    asset_data = cmd['payload']['exec']['data']

    # tx info
    item_id = asset_data['itemId']
    buyer_id = asset_data['buyer_id']
    seller_id = asset_data['seller_id']
    price = asset_data['price']
    amount = asset_data['amount']

    # validate sale status
    sale = db.session.query(Sale).filter(Sale.id == post_data['saleId']).first()
    if not sale:
        return get_error_response('Sale is not existed')
    elif sale.remaining <= 0:
        return get_error_response('The remaining amount of sale should be larger than 0')
    elif sale.status != 'open':
        return get_error_response('Sale status is not open')

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
    for i in range(5):
        try:
            result = fetch_listen(listen_cmd, app.config['API_HOST'])
            app.logger.debug('listen result = {}'.format(result))
            if not isinstance(result, dict):
                # return error message if CMD listening occurs error
                app.logger.debug('LISTEN error', result)
                return get_error_response(result)

            break
        except:
            app.logger.debug('retry')

   # record purchase action
    try:
        app.logger.debug('now update purchase for {}, {}, {}'.format(item_id, buyer_id, seller_id))
        purchase_id = random()
        purchase = Purchase(
            id=purchase_id,
            chain_id=app.config['CHAINWEB']['CHAIN_ID'],
            block_height=result['metaData']['blockHeight'],
            block_hash=result['metaData']['blockHash'],
            block_time=dt_from_ts(result['metaData']['blockTime']),
            tx_id=result['txId'],
            tx_hash=result['reqKey'],
            tx_status=result['result']['status'],
            item_id=item_id,
            buyer=buyer_id,
            seller=seller_id,
            price=price,
            amount=amount
        )
        # TODO: add fees and payments
        db.session.add(purchase)
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

    # update asset
    try:
        app.logger.debug('now update asset for {}, {}'.format(item_id, buyer_id))
        update_asset(item_id, buyer_id)
    except Exception as e:
        app.logger.exception(e)
    try:
        app.logger.debug('now update asset for {}, {}'.format(item_id, seller_id))
        update_asset(item_id, seller_id)
    except Exception as e:
        app.logger.exception(e)

    # update sale
    try:
        app.logger.debug('now update asset for {}, {}'.format(item_id, seller_id))
        sale.remaining = sale.remaining - amount
        if (sale.remaining == 0):
            sale.status = 'closed'
        db.session.commit()
    except Exception as e:
        app.logger.exception(e)

    return get_success_response(result)


@asset_blueprint.route('/fix', methods=['POST'])
@login_required
def fix_asset():
    post_data = request.json
    app.logger.debug('Execute fix for {}'.format(post_data))

    item_id = post_data.get('itemId')
    user_id = get_current_user()

    item_ids = []
    if not item_id:            
        pact_code = '({}.all-items "{}")'.format(get_module_names()['colorblock'], user_id)
        local_cmd = build_local_cmd(pact_code)
        result = local_req(local_cmd)
        for fetched_item in result['data']:
            app.logger.debug(fetched_item)
            title = fetched_item['title']
            creator = fetched_item['creator']
            for db_item in db.session.query(Item).filter(Item.title == title, Item.creator == creator).all():
                app.logger.debug(db_item)
                item_id = db_item.id
                if item_id not in item_ids:
                    item_ids.append(item_id)
    else:
        item_ids = [item_id]

    for item_id in item_ids:
        # update asset
        try:
            app.logger.debug('now update asset for {}, {}'.format(item_id, user_id))
            update_asset(item_id, user_id)
        except Exception as e:
            app.logger.exception(e)

        # fix sale
        try:
            app.logger.debug('now update sale for {}, {}'.format(item_id, user_id))
            sale_id = combined_id(item_id, user_id)
            sale = db.session.query(Sale).filter(Sale.id == sale_id).first()
            if sale and sale.status == 'open':
                pact_code = '({}.item-deposit-details "{}" "{}")'.format(get_module_names()['colorblock-market'], item_id, user_id)
                local_cmd = build_local_cmd(pact_code)
                result = local_req(local_cmd)
                sale.remaining = result['data']['amount']
                if sale.total < sale.remaining:
                    sale.total = sale.remaining
                db.session.commit()
            elif sale:
                sale.total = 0
                sale.remaining = 0
                sale.status = 'canceled'
                db.session.commit()
        except Exception as e:
            app.logger.exception(e)

    msg = 'No item fixed' if not item_ids else  {'fixed_items': item_ids, 'cnt': len(item_ids) }
    result = {
        'status': 'success',
        'data': msg
    }
    return get_success_response(result)

