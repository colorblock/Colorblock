from flask import Blueprint, send_from_directory, current_app as app

static_blueprint = Blueprint('static', __name__)

@static_blueprint.route('/img/<filename>')
def send_img(filename):
    app.logger.debug(app.static_folder)
    return send_from_directory('static/img', filename)