from flask import Blueprint, session, jsonify, current_app as app
import json

from app import db
from app.models.user import User
from app.utils.security import login_required, get_current_user
from app.utils.pact import build_local_cmd, local_req

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/')
@login_required
def get_myself():
    user_id = get_current_user()
    user = db.session.query(User).filter(User.address == user_id).first()
    return jsonify(user)

@user_blueprint.route('/<user_id>')
def get_user(user_id):
    user = db.session.query(User).filter(User.address == user_id).first()
    return jsonify(user)

@user_blueprint.route('/kda-balance', methods=['POST'])
@login_required
def get_kda_balance():
    user_id = get_current_user()
    pact_code = '(coin.get-balance "{}")'.format(user_id)
    local_cmd = build_local_cmd(pact_code)
    app.logger.debug(json.dumps(local_cmd))
    result = local_req(local_cmd)
    return result