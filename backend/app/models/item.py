from dataclasses import dataclass
from sqlalchemy.sql import func
from app import db

@dataclass
class Item(db.Model):
    id: str
    title: str
    type: int
    tags: str
    description: str
    creator: str
    supply: int
    tx_id: str
    created_at: str
    updated_at: str

    id = db.Column(db.String(), primary_key=True)
    title = db.Column(db.String())
    type = db.Column(db.Integer())
    tags = db.Column(db.String())
    description = db.Column(db.String())
    creator = db.Column(db.String())
    supply = db.Column(db.Integer())
    tx_id = db.Column(db.String())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<Item {}>'.format(self.title)