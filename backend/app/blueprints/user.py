from flask import Blueprint
from app import db
from app.models.user import User

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/')
def index():
    admin = User(uname='admin', address='example_address')
    db.session.add(admin)
    db.session.commit()
    return 'str(k)'

@user_blueprint.route('/new')
def a():
    return 'str(k)'