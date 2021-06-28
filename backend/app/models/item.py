from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class Item(db.Model):
    
    __tablename__ = 'item'
    __searchable__ = ['id', 'title', 'tags', 'description']

    id: str
    title: str
    type: int
    tags: str
    description: str
    creator: str
    supply: int
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)  # Format: CB + uuid
    title = db.Column(db.String)
    type = db.Column(db.Integer)
    tags = db.Column(db.String)
    description = db.Column(db.String)
    creator = db.Column(db.String)
    supply = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Item {}>'.format(self.title)
