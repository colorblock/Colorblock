from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.blueprints.admin.routine import update_deal, update_ledger
from app.models.deal import Deal
from app.models.item import Item
from app.models.ledger import Ledger
from app.utils.response import get_error_response
from app.utils.security import login_required
from app.utils.tools import jsonify_data
from app.utils.pact import send_req

asset_blueprint = Blueprint('asset', __name__)

@asset_blueprint.route('/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = db.session.query(Ledger).filter(Ledger.asset_id == asset_id).first()
    asset = jsonify_data(asset)
    item = db.session.query(Item).filter(Item.id == asset['item_id']).first()
    item = jsonify_data(item)
    asset['item'] = item
    deal = db.session.query(Deal).filter(Deal.item_id == item['id']).first()
    deal = jsonify_data(deal)
    asset['deal'] = deal
    return jsonify(asset)

@asset_blueprint.route('/owned-by/<user_id>', methods=['GET'])
def get_assets_owned_by_user(user_id):
    assets = db.session.query(Ledger).filter(Ledger.user_id == user_id).all()
    assets = jsonify_data(assets)
    item_ids = [v['item_id'] for v in assets]
    items = db.session.query(Item).filter(Item.id.in_(item_ids)).all()
    for asset in assets:
        item_id = asset['item_id']
        item = [v for v in items if v.id == item_id][0]
        item = jsonify_data(item)
        asset['item'] = item
    return jsonify(assets)

@asset_blueprint.route('/all', methods=['GET'])
def get_all_asset():
    assets = Ledger.query.all()
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