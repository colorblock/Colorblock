from flask import Blueprint, session, jsonify, current_app as app

from app import db
from app.models.project import Project
from app.models.user import User
from app.utils.security import login_required, get_current_user

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/')
@login_required
def get_current_user():
    app.logger.debug(session)
    user_id = session['account']
    user = db.session.query(User).filter(User.id == user_id).first()
    return jsonify(user)

@user_blueprint.route('/<user_id>')
def get_user(user_id):
    app.logger.debug('in user id')
    user = db.session.query(User).filter(User.id == user_id).first()
    return jsonify(user)