from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.blueprints.admin.routine import update_deal, update_ledger
from app.models.deal import Deal
from app.models.item import Item
from app.models.ledger import Ledger
from app.models.purchase import Purchase
from app.utils.response import get_error_response
from app.utils.security import login_required
from app.utils.tools import jsonify_data
from app.utils.pact import send_req
from app.utils.crypto import hash_id

asset_blueprint = Blueprint('asset', __name__)

@asset_blueprint.route('/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = db.session.query(Ledger).filter(Ledger.asset_id == asset_id).first()
    if asset:
        asset = jsonify_data(asset)
        item = db.session.query(Item).filter(Item.id == asset['item_id']).first()
        item = jsonify_data(item)
        asset['item'] = item
        deal = db.session.query(Deal).filter(Deal.item_id == item['id'], Deal.user_id == asset['user_id']).first()
        deal = jsonify_data(deal)
        asset['deal'] = deal
    return jsonify(asset)

@asset_blueprint.route('/owned-by/<user_id>', methods=['GET'])
def get_assets_owned_by_user(user_id):
    assets = db.session.query(Ledger).filter(Ledger.user_id == user_id).all()
    if len(assets) > 0:
        assets = jsonify_data(assets)
        item_ids = [v['item_id'] for v in assets]
        items = db.session.query(Item).filter(Item.id.in_(item_ids)).all()
        for asset in assets:
            ledger_id = asset['id']
            item_id = asset['item_id']
            item = [v for v in items if v.id == item_id][0]
            item = jsonify_data(item)
            deal = db.session.query(Deal).filter(Deal.id == ledger_id).first()
            asset['item'] = item
            if deal:
                asset['deal'] = deal
    return jsonify(assets)

@asset_blueprint.route('/latest')
def get_latest_assets():
    purchases = db.session.query(Purchase).order_by(Purchase.created_at.desc()).limit(50).all()
    deals = db.session.query(Deal).order_by(Deal.created_at.desc()).limit(50).all()
    purchase_ids = ['{}:{}'.format(v.item_id, v.seller) for v in purchases]
    deal_ids = ['{}:{}'.format(v.item_id, v.user_id) for v in deals]
    ledger_ids = purchase_ids + deal_ids
    assets = []
    item_ids = []
    count = 0
    for ledger_id in ledger_ids:
        asset = db.session.query(Ledger).filter(Ledger.id == ledger_id).first()
        deal = db.session.query(Deal).filter(Deal.id == ledger_id).first()
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
                ledger_id = '{}:{}'.format(item_id, user_id)
                asset = db.session.query(Ledger).filter(Ledger.id == ledger_id).first()
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

@asset_blueprint.route('/release', methods=['POST'])
@login_required
def release_asset():
    post_data = request.json
    app.logger.debug('post_data: {}'.format(post_data))

    cmd = json.loads(post_data['cmds'][0]['cmd'])
    asset_data = cmd['payload']['exec']['data']

    item_id = asset_data['token']
    seller = asset_data['seller']
    ledger_id = '{}:{}'.format(item_id, seller)
    asset = db.session.query(Ledger).filter(Ledger.id == ledger_id).first()

    if asset_data['amount'] > asset.balance:
        return get_error_response('Balance is not sufficient')

    # submit item to pact server
    result = send_req(post_data)
        
    if result['status'] == 'success':
        deal_id = ledger_id
        update_deal(deal_id)
        update_ledger(ledger_id)

    return result

@asset_blueprint.route('/recall', methods=['POST'])
@login_required
def recall_asset():
    post_data = request.json
    app.logger.debug('post_data: {}'.format(post_data))

    cmd = json.loads(post_data['cmds'][0]['cmd'])
    asset_data = cmd['payload']['exec']['data']

    item_id = asset_data['token']
    seller = asset_data['seller']
    ledger_id = '{}:{}'.format(item_id, seller)

    # submit item to pact server
    result = send_req(post_data)
        
    if result['status'] == 'success':
        deal_id = ledger_id
        update_deal(deal_id)
        update_ledger(ledger_id)

    return result

@asset_blueprint.route('/purchase', methods=['POST'])
@login_required
def purchase_asset():
    post_data = request.json
    app.logger.debug('post_data: {}'.format(post_data))

    cmd = json.loads(post_data['cmds'][0]['cmd'])
    asset_data = cmd['payload']['exec']['data']

    item_id = asset_data['token']
    buyer = asset_data['buyer']
    seller = asset_data['seller']
    ledger_buyer_id = '{}:{}'.format(item_id, buyer)
    ledger_seller_id = '{}:{}'.format(item_id, seller)

    # submit item to pact server
    result = send_req(post_data)
        
    if result['status'] == 'success':
        deal_id = ledger_seller_id
        update_deal(deal_id)
        update_ledger(ledger_buyer_id)
        update_ledger(ledger_seller_id)
        
        result['data'] = {
            'assetId': hash_id(ledger_buyer_id)
        }

    return result