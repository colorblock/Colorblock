from dataclasses import dataclass
from sqlalchemy.schema import FetchedValue
from app import db

@dataclass
class Deal(db.Model):
    id: str
    item_id: str
    user_id: int
    price: float
    total: int
    remain: int
    open: bool
    created_at: str
    updated_at: str

    id = db.Column(db.String, primary_key=True)
    item_id = db.Column(db.String)
    user_id = db.Column(db.Integer)
    price = db.Column(db.Numeric)
    total = db.Column(db.Integer)
    remain = db.Column(db.Integer)
    open = db.Column(db.Boolean)
    created_at = db.Column(db.DateTime, server_default=FetchedValue())
    updated_at = db.Column(db.DateTime, server_default=FetchedValue())

    def __repr__(self):
        return '<Deal {}>'.format(self.id)