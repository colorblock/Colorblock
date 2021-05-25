from dataclasses import dataclass
from sqlalchemy.sql import func
from app import db

@dataclass
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String())
    uname = db.Column(db.String())
    avatar = db.Column(db.String())
    profile = db.Column(db.String())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<User {}>'.format(self.username)