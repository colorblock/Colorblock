from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.models.item import Item
from app.models.ledger import Ledger
from app.utils.tools import jsonify_data

asset_blueprint = Blueprint('asset', __name__)

@asset_blueprint.route('/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = db.session.query(Ledger).filter(Ledger.asset_id == asset_id).first()
    asset = jsonify_data(asset)
    item = db.session.query(Item).filter(Item.id == asset['item_id']).first()
    item = jsonify_data(item)
    asset['item'] = item
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
