from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.blueprints.admin.routine import update_deal, update_asset
from app.models.sale import Sale
from app.models.user import User
from app.models.asset import Asset
from app.utils.response import get_error_response, get_success_response
from app.utils.security import get_current_user, login_required
from app.utils.pact import get_module_names, send_req, build_unsigned_send_cmd

sale_blueprint = Blueprint('sale', __name__)

@sale_blueprint.route('/<sale_id>', methods=['GET'])
def get_sale(sale_id):
    sale = db.session.query(Sale).filter(Sale.id == sale_id).first()
    return jsonify(sale)

@sale_blueprint.route('/create', methods=['POST'])
@login_required
def create_sale():
    post_data = request.json
    app.logger.debug('post_data: {}'.format(post_data))

    cmd = json.loads(post_data['cmds'][0]['cmd'])
    valid_cmd = build_sale_cmd()
    if cmd != valid_cmd['data']:
        return get_error_response('Command matched error')

    item_id = post_data['item_id']
    user_id = get_current_user()
    Asset = db.session.query(Asset).filter(Asset.item_id == item_id, Asset.user_id == user_id).first()

    # submit item to pact server
    result = send_req(post_data)
        
    if result['status'] == 'success':
        deal_id = asset_id
        update_deal(deal_id)
        update_asset(asset_id)

    return result

@sale_blueprint.route('/create/build', methods=['POST'])
@login_required
def build_sale_cmd():
    post_data = request.json
    app.logger.debug('post_data: {}'.format(post_data))
            
    # constants
    modules = get_module_names()

    item_id = post_data['item_id']
    user_id = get_current_user()
    amount = post_data['amount']
    code = '(free.colorblock-market-test.deposit-item "{}" "{}" (read-decimal "amount"))'.format(item_id, user_id)

    user = db.session.query(User).filter(User.id == user_id).first()
    public_key = user.public_key
    if not public_key:
        return get_error_response('User has no public key')

    cmd_config = {
        'public_key': public_key,
        'capabilities': [
            {
                'name': '{}.DEPOSIT-ITEM'.format(modules['colorblock-market']),
                'args': [item_id, user_id, amount]
            },
        ],        
        'gas_limit': 50000,
    }
    data = {
        'amount': amount
    }

    unsigned_cmd = build_unsigned_send_cmd(code, pact_data=data, cmd_config=cmd_config)
    return get_success_response(unsigned_cmd)