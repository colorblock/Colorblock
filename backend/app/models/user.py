from app import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uname = db.Column(db.String(32))
    address = db.Column(db.String(65))

    def __repr__(self) -> str:
        return '<User {}>'.format(self.username)