from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from flask.json import JSONEncoder
from datetime import datetime

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

    app.json_encoder = CustomJSONEncoder 

    from app.blueprints.user import user_blueprint
    app.register_blueprint(user_blueprint, url_prefix='/user')
    from app.blueprints.item import item_blueprint
    app.register_blueprint(item_blueprint, url_prefix='/item')
    from app.blueprints.tool import tool_blueprint
    app.register_blueprint(tool_blueprint, url_prefix='/tool')
    from app.blueprints.static import static_blueprint
    app.register_blueprint(static_blueprint, url_prefix='/static')
    from app.blueprints.security import security_blueprint
    app.register_blueprint(security_blueprint, url_prefix='/')

    return app


class CustomJSONEncoder(JSONEncoder):
  "Add support for serializing timedeltas"

  def default(self, o):
    if type(o) == datetime:
      return o.isoformat()
    else:
      return super().default(o)