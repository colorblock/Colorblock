from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class Project(db.Model):

    id:str
    user_id: str
    title: str
    frames: str
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)
    user_id = db.Column(db.String)
    title = db.Column(db.String)
    frames = db.Column(db.String)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Project {}>'.format(self.title)
