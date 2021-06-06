from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue

from app import db

@dataclass
class Collectible(db.Model):

    id: str
    item_id: str
    collection_id: str
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)
    item_id = db.Column(db.String)
    collection_id = db.Column(db.String)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Collectible {}>'.format(self.id)
