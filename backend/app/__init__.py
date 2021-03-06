from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_msearch import Search
import cloudinary

from flask.json import JSONEncoder
from datetime import datetime
import decimal

db = SQLAlchemy(engine_options={
    'pool_size': 10,
    'pool_recycle': 120,
    'pool_pre_ping': True
})
search = Search()

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.url_map.strict_slashes = False

    # load config from public config and then secret
    app.config.from_object('config')
    try:
        app.config.from_object('instance.config')
    except Exception as e:
        app.logger.exception(e)

    app.config['mode'] = 'prod' if app.config['ENV'] == 'production' else 'dev'

    db_config = app.config['DATABASE']
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://{}:{}@{}:{}/{}'.format(
        db_config['USERNAME'],
        db_config['PASSWORD'],
        db_config['HOSTNAME'][app.config['mode']],
        db_config['PORT'],
        db_config['DATABASE']
    )
    db.init_app(app)

    search.init_app(app)
    
    cloudinary.config(
        cloud_name = app.config['CLOUDINARY_NAME'],  
        api_key = app.config['CLOUDINARY_KEY'],  
        api_secret = app.config['CLOUDINARY_SECRET']  
    )

    app.secret_key = app.config['SECRET_KEY']
    CORS(app, supports_credentials=True, resources={r'/*': {'origins': app.config['CORS_ORIGINS']}})

    app.json_encoder = CustomJSONEncoder

    from app.blueprints.user import user_blueprint
    app.register_blueprint(user_blueprint, url_prefix='/user')
    from app.blueprints.item import item_blueprint
    app.register_blueprint(item_blueprint, url_prefix='/item')
    from app.blueprints.asset import asset_blueprint
    app.register_blueprint(asset_blueprint, url_prefix='/asset')
    from app.blueprints.collection import collection_blueprint
    app.register_blueprint(collection_blueprint, url_prefix='/collection')
    #from app.blueprints.sale import sale_blueprint
    #app.register_blueprint(sale_blueprint, url_prefix='/sale')
    from app.blueprints.colorful import colorful_blueprint
    app.register_blueprint(colorful_blueprint, url_prefix='/colorful')
    from app.blueprints.project import project_blueprint
    app.register_blueprint(project_blueprint, url_prefix='/project')
    from app.blueprints.tool import tool_blueprint
    app.register_blueprint(tool_blueprint, url_prefix='/tool')
    from app.blueprints.search import search_blueprint
    app.register_blueprint(search_blueprint, url_prefix='/search')
    from app.blueprints.static import static_blueprint
    app.register_blueprint(static_blueprint, url_prefix='/static')

    from app.blueprints.auth import auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/')
    from app.blueprints.admin.routine import routine_blueprint
    app.register_blueprint(routine_blueprint, url_prefix='/routine')
    from app.blueprints.admin.mint import mint_blueprint
    app.register_blueprint(mint_blueprint, url_prefix='/mint')

    return app


class CustomJSONEncoder(JSONEncoder):
  'Add support for serializing timedeltas'

  def default(self, o):
    if isinstance(o, datetime):
      return o.isoformat()
    if isinstance(o, decimal.Decimal):
        return float(o)
    else:
      return super().default(o)
