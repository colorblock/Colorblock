from flask import Blueprint, config, request, current_app as app, send_file
import os

from app.utils.crypto import hash_id, random
from app.utils.render import generate_pixels_from_image

tool_blueprint = Blueprint('tool', __name__)

@tool_blueprint.route('/hash', methods=['POST'])
def get_hash():
    post_data = request.json
    input_str = post_data['to_hash']
    id = hash_id(input_str)
    return id

@tool_blueprint.route('/pixel', methods=['POST'])
def get_pixel():
    form_data = request.form
    max_width = int(form_data['max_width'])

    image_id = random()
    file = request.files['image']
    file_type = file.filename.split('.')[-1].lower()
    app.logger.debug('image_id = {}'.format(image_id))
    if file_type not in app.config['PIXEL_FILETYPES']:
        return 'File extension is not supported', 500
    else:
        file_path = 'app/static/img/tmp/{}.{}'.format(image_id, file_type)
        app.logger.debug(os.path.basename(file_path))
        file.save(file_path)
        save_path = generate_pixels_from_image(file_path, max_width=max_width)
        return send_file(save_path, mimetype='image/{}'.format(file_type))
