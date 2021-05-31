from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class User(db.Model):
    
    __tablename__ = 'user'
    __searchable__ = ['id', 'address', 'uname', 'profile']

    id: str
    address: str
    uname: str
    avatar: str
    profile: str
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)
    address = db.Column(db.String)
    uname = db.Column(db.String)
    avatar = db.Column(db.String)
    profile = db.Column(db.String)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<User {}>'.format(self.uname)