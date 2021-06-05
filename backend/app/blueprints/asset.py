from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.models.ledger import Ledger

asset_blueprint = Blueprint('asset', __name__)

@asset_blueprint.route('/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = db.session.query(Ledger).filter(Ledger.asset_id == asset_id).first()
    return jsonify(asset)

@asset_blueprint.route('/all', methods=['GET'])
def get_all_asset():
    assets = Ledger.query.all()
    return jsonify(assets)