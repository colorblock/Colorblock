from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
import requests


def create_app():
    app = Flask(__name__, instance_relative_config=True)
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
    db = SQLAlchemy(app)

    class User(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        uname = db.Column(db.String(32))
        address = db.Column(db.String(65))

        def __repr__(self) -> str:
            return '<User {}>'.format(self.username)

    @app.route('/')
    def hello_world():
        return 'Hello, World!'

    @app.route('/user')
    def user():
        admin = User(uname='admin', address='example_address')
        db.session.add(admin)
        db.session.commit()
        return 'user added'

    @app.route('/item', methods=['POST'])
    def submit_item():
        data = request.json
        url = 'http://api.colorblockart.com/api/v1/send'
        try:
            res = requests.post(url, json=data)
            request_key_data = res.json()
            request_key = request_key_data['requestKeys'][0]

            url = 'http://api.colorblockart.com/api/v1/poll'
            res = requests.post(url, json=request_key_data)
            result = res.json()[request_key]['result']
            
            app.logger.debug(result)
            if result['status'] == 'success':
                return 'success'
            else:
                return ''
        except Exception as e:
            app.logger.error(e)
            return 'network error'

    return app