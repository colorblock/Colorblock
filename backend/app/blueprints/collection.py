from flask import Blueprint, request, session, current_app as app, jsonify

from app import db
from app.models.item import Item
from app.models.collection import Collection
from app.models.collectible import Collectible
from app.models.mint import Mint
from app.utils.crypto import hash_id
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

@collection_blueprint.route('/of-item/<item_id>')
def get_collection_of_item(item_id):
    collectible = db.session.query(Collectible).filter(Collectible.item_id == item_id).order_by(Collectible.created_at).first()
    if collectible:
        collection_id = collectible.collection_id
        collection = db.session.query(Collection).filter(Collection.id == collection_id).first()
        collectibles = db.session.query(Collectible).filter(Collectible.collection_id == collection_id).order_by(Collectible.created_at).limit(20).all()
        collection = jsonify_data(collection)
        collectibles = jsonify_data(collectibles)
        collection['collectibles'] = collectibles
    else:
        collection = {}
    
    return jsonify(collection)

@collection_blueprint.route('/latest')
def get_latest_collections():
    collections = db.session.query(Collection).order_by(Collection.created_at.desc()).limit(50).all()
    count = 0
    filted_collections = []
    if collections:
        collections = jsonify_data(collections)
        for collection in collections:
            collection_id = collection['id']
            collectibles = db.session.query(Collectible).filter(Collectible.collection_id == collection_id).limit(20).all()
            collectibles = jsonify_data(collectibles)
            collection['collectibles'] = collectibles
            items = []
            for collectible in collectibles:
                item_id = collectible['item_id']
                item = db.session.query(Item).filter(Item.id == item_id).first()
                if item:
                    item = jsonify_data(item)
                    items.append(item)
            
            if items:
                collection['items'] = items
                filted_collections.append(collection)
                count += 1
                if count >= 20:
                    break

    return jsonify(filted_collections)

@collection_blueprint.route('/<collection_id>/items')
def get_items_in_collections(collection_id):
    collection = db.session.query(Collection).filter(Collection.id == collection_id).first()
    items = []
    if collection:
        collection = jsonify_data(collection)
        collection_id = collection['id']
        collectibles = db.session.query(Collectible).filter(Collectible.collection_id == collection_id).limit(20).all()
        collectibles = jsonify_data(collectibles)
        collection['collectibles'] = collectibles
        for collectible in collectibles:
            item_id = collectible['item_id']
            item = db.session.query(Item).filter(Item.id == item_id).first()
            if item:
                item = jsonify_data(item)
                items.append(item)
                item_id = item['id']
                mint = db.session.query(Mint).filter(Mint.item_id == item_id).first()
                if mint:
                    mint = jsonify_data(mint)
                    item['mint'] = mint

    return jsonify(items)

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

@collection_blueprint.route('/add_item', methods=['POST'])
@login_required
def add_item_into_collections():
    post_data = request.json
    collection_id = post_data['collectionId']
    item_id = post_data['itemId']
    collectible = db.session.query(Collectible).filter(Collectible.item_id == item_id, Collectible.collection_id == collection_id).first()
    if not collectible:
        collectible_id = hash_id('{}:{}'.format(item_id, collection_id))
        collectible = Collectible(
            id=collection_id,
            item_id=item_id,
            collection_id=collection_id
        )
        db.session.add(collectible)
        db.session.commit()
    return get_success_response('success')
