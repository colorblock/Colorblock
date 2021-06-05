from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue
from app import db

@dataclass
class Ledger(db.Model):
    id: str
    asset_id: str
    item_id: str
    user_id: int
    balance: int
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)
    asset_id = db.Column(db.String)
    item_id = db.Column(db.String)
    user_id = db.Column(db.Integer)
    balance = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Ledger {}>'.format(self.id)