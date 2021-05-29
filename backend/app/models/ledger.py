from dataclasses import dataclass
from sqlalchemy.sql import func
from app import db

@dataclass
class Ledger(db.Model):
    id: str
    item_id: str
    user_id: int
    balance: int
    block_hash: str
    created_at: str
    updated_at: str

    id = db.Column(db.String(), primary_key=True)
    item_id = db.Column(db.String())
    user_id = db.Column(db.Integer())
    balance = db.Column(db.Integer())
    block_hash = db.Column(db.String())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<Ledger {}>'.format(self.id)