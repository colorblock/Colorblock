from flask import Blueprint, jsonify
from app import db
from app.models.user import User

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/<user_id>')
def get_user(user_id):
    user = db.session.query(User).filter(User.id == user_id).first()
    return jsonify(user)
