from dataclasses import dataclass
from sqlalchemy.sql import func
from app import db

@dataclass
class Purchase(db.Model):
    id: str
    item_id: str
    buyer_id: str
    seller_id: str
    price: float
    amount: int
    tx_id: str
    created_at: str
    updated_at: str

    id = db.Column(db.String(), primary_key=True)
    item_id = db.Column(db.String())
    buyer_id = db.Column(db.String())
    seller_id = db.Column(db.String())
    price = db.Column(db.Numeric())
    amount = db.Column(db.Integer())
    tx_id = db.Column(db.String())
    created_at = db.Column(db.DateTime(), server_default=func.now())
    updated_at = db.Column(db.DateTime(), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return '<Purchase {}>'.format(self.id)