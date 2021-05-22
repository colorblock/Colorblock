from flask import Blueprint, request
from app.utils.crypto import hash_id

tool_blueprint = Blueprint('tool', __name__)

@tool_blueprint.route('/hash', methods=['POST'])
def get_hash():
    post_data = request.json
    input_str = post_data['to_hash']
    id = hash_id(input_str)
    return id
