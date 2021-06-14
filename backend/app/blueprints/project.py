from flask import Blueprint, request, jsonify, current_app as app

from app import db
from app.models.project import Project
from app.utils.response import get_error_response, get_success_response
from app.utils.security import login_required, get_current_user
from app.utils.crypto import hash_id

project_blueprint = Blueprint('project', __name__)

@project_blueprint.route('/', methods=['POST'])
@login_required
def get_projects():
    user_id = get_current_user()
    projects = db.session.query(Project).filter(Project.user_id == user_id).all()
    return jsonify(projects)

@project_blueprint.route('/new', methods=['POST'])
@login_required
def create_project():
    post_data = request.json
    if not post_data.get('title'):
        return get_error_response('please name your project')

    user_id = get_current_user()
    project_id = hash_id('{}:{}'.format(user_id, post_data))
    project = Project(
        id=project_id,
        user_id=user_id,
        title=post_data['title'],
        frames=post_data['frames'],
        palette=post_data['palette']
    )
    db.session.add(project)
    db.session.commit()

    return get_success_response('save successfully')

@project_blueprint.route('/save/<project_id>', methods=['POST'])
@login_required
def save_project(project_id):
    post_data = request.json
    if not post_data.get('title'):
        return get_error_response('please name your project')

    user_id = get_current_user()
    project = db.session.query(Project).filter(Project.id == project_id).first()
    if project:
        project.title = post_data['title']
        project.frames = post_data['frames']
        project.palette = post_data['palette']
        db.session.commit()
    else:
        return get_error_response('project is not existed')

    return get_success_response('save successfully')