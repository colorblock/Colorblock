from flask import Blueprint, request, current_app as app, jsonify
import json

from app import db
from app.utils.tools import jsonify_data
from app.models.item import Item
from app.models.user import User
from app.models.mint import Mint

search_blueprint = Blueprint('search', __name__)

@search_blueprint.route('/<keyword>')
def search(keyword):
    items = Item.query.msearch(keyword).limit(50).all()
    users = User.query.msearch(keyword).limit(50).all()
    result = {
        'items': items,
        'users': users,
    }
    result = jsonify_data(result)
    for item in result['items']:
        item_id = item['id']
        mint = db.session.query(Mint).filter(Mint.item_id == item_id).first()
        if mint:
            mint = jsonify_data(mint)
            item['mint'] = mint

    return jsonify(result)