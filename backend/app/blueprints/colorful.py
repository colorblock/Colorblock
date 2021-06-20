from flask import Blueprint, request, session, current_app as app, jsonify
import json

from app import db
from app.blueprints.admin.routine import update_deal, update_asset
from app.models.sale import Sale
from app.models.user import User
from app.models.asset import Asset
from app.utils.response import get_error_response, get_success_response
from app.utils.security import get_current_user, login_required
from app.utils.pact import add_manager_sig, get_module_names, send_req, build_unsigned_send_cmd

colorful_blueprint = Blueprint('colorful', __name__)

@colorful_blueprint.route('/create-wallet', methods=['POST'])
def create_wallet():
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
    app.logger.debug('unsigned_cmd: {}'.format(unsigned_cmd))

    signed_cmd = add_manager_sig(unsigned_cmd)
    app.logger.debug('signed_cmd: {}'.format(signed_cmd))

    #send_req(signed_cmd)
    return get_success_response(signed_cmd)