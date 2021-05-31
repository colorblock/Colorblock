from flask import Blueprint, request, current_app as app, jsonify
import json

from app.models.item import Item
from app.models.user import User

search_blueprint = Blueprint('search', __name__)

@search_blueprint.route('/<keyword>')
def search(keyword):
    items = Item.query.msearch(keyword).all()
    users = User.query.msearch(keyword).all()
    result = {
        'items': items,
        'users': users,
    }
    return jsonify(result)