from flask import Blueprint, request, session, current_app as app, jsonify

from app import db
from app.models.item import Item
from app.models.collection import Collection
from app.models.collectible import Collectible
from app.utils.response import get_success_response
from app.utils.tools import jsonify_data
from app.utils.security import login_required, get_current_user

collection_blueprint = Blueprint('collection', __name__)

@collection_blueprint.route('/<collection_id>', methods=['GET'])
def get_collection(collection_id):
    collection = db.session.query(Collection).filter(Collection.collection_id == collection_id).first()
    if collection:
        collection = jsonify_data(collection)
        collectibles = db.session.query(Collectible).filter(Collectible.collection_id == collection['id']).all()
        collectibles = jsonify_data(collectibles)
        collection['collectibles'] = collectibles
    return jsonify(collection)

@collection_blueprint.route('/owned-by/<user_id>', methods=['GET'])
def get_collections_owned_by_user(user_id):
    collections = db.session.query(Collection).filter(Collection.user_id == user_id).all()
    if len(collections) > 0:
        collections = jsonify_data(collections)
        collection_ids = [v['id'] for v in collections]
        all_collectibles = db.session.query(Collectible).filter(Collectible.collection_id.in_(collection_ids)).all()
        for collection in collections:
            collection_id = collection['id']
            collectibles = [v for v in all_collectibles if v.collection_id == collection_id]
            collectibles = jsonify_data(collectibles)
            collection['collectibles'] = collectibles
    return jsonify(collections)

@collection_blueprint.route('/latest')
def get_latest_collections():
    collections = db.session.query(Collection).order_by(Collection.created_at.desc()).limit(50).all()
    count = 0
    filted_collections = []
    if collections:
        collections = jsonify_data(collections)
        for collection in collections:
            collection_id = collection['id']
            collectible = db.session.query(Collectible).filter(Collectible.collection_id == collection_id).first()
            if collectible:
                collectible = jsonify_data(collectible)
                item_id = collectible['item_id']
                item = db.session.query(Item).filter(Item.id == item_id).first()
                if item:
                    item = jsonify_data(item)
                    collection['collectible'] = collectible
                    collection['item'] = item
                    filted_collections.append(collection)
                    count += 1
                    if count >= 20:
                        break

    return jsonify(filted_collections)

@collection_blueprint.route('/', methods=['POST'])
@login_required
def post_collections():
    collections = request.json
    collection_ids = [v['id'] for v in collections]
    user_id = get_current_user()
    collections_db = db.session.query(Collection).filter(Collection.user_id == user_id).all()
    collection_ids_db = [v.id for v in collections_db]
    for collection in collections_db:
        collection_id = collection.id
        if collection_id not in collection_ids:
            # need to remove
            db.session.delete(collection)
            db.session.commit()
    for collection in collections:
        collection_id = collection['id']
        if collection_id not in collection_ids_db:
            collection = Collection(
                id=collection_id,
                user_id=user_id,
                title=collection['title']
            )
            db.session.add(collection)
            db.session.commit()
    return get_success_response('success')