from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.url_map.strict_slashes = False
    CORS(app)

    try:
        app.config.from_object('instance.config')
    except:
        app.config.from_object('config')

    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://{}:{}@{}:{}/{}'.format(
        app.config['USERNAME'], 
        app.config['PASSWORD'], 
        app.config['HOSTNAME'], 
        app.config['PORT'],
        app.config['DATABASE']
    )
    db.init_app(app)

    from app.blueprints.user import user_blueprint
    app.register_blueprint(user_blueprint, url_prefix='/user')
    from app.blueprints.item import item_blueprint
    app.register_blueprint(item_blueprint, url_prefix='/item')

    return app