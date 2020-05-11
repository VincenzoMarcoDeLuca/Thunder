from app import db, login
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from hashlib import md5


class User(UserMixin,db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True)
    password_hash = db.Column(db.String(128))
    notifications_sended = db.relationship('Notification', backref='user_sender', lazy='dynamic', foreign_keys="Notification.sender")
    notifications_received = db.relationship('Notification', backref='user_receiver', lazy='dynamic', foreign_keys="Notification.receiver")
    user_friends = db.relationship('Friends', backref='user_follower', lazy='dynamic',foreign_keys="Friends.user_id")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<User {}>'.format(self.username)

    def avatar(self, size):
        digest = md5(self.email.lower().encode('utf-8')).hexdigest()
        return 'https://www.gravatar.com/avatar/{}?d=identicon&s={}'.format(
            digest, size)

    def add_friend(self, friend):
        if (friend != self) and (not self.is_friend(friend)):
            db.session.add(Friends(user_id=self.id, friend_id=friend.id, points=0, has_shield=False, is_channel_on=False))
            db.session.add(Friends(user_id=friend.id, friend_id=self.id, points=0, has_shield=False, is_channel_on=False))
            db.session.commit()

    def unfriend(self, friend):
        if self.is_friend(friend):
            db.session.delete(Friends.query.filter_by(user_id=self.id,friend_id=friend.id).first())
            db.session.delete(Friends.query.filter_by(user_id=friend.id, friend_id=self.id).first())
            db.session.commit()

    def is_friend(self, friend):
        return Friends.query.filter_by(friend_id=friend.id,user_id=self.id).count()>0

    def add_channel(self, friend):
        if not (self.is_channel_on(friend)):
            friendship_leftside=Friends.query.filter_by(user_id=self.id, friend_id=friend.id).first()
            friendship_rightside=Friends.query.filter_by(user_id=friend.id, friend_id=self.id).first()
            friendship_leftside.is_channel_on = True
            friendship_rightside.is_channel_on = True
            db.session.commit()

    def delete_channel(self, friend):
        if self.is_channel_on(friend):
            friendship_leftside = Friends.query.filter_by(user_id=self.id, friend_id=friend.id).first()
            friendship_rightside = Friends.query.filter_by(user_id=friend.id, friend_id=self.id).first()
            friendship_leftside.is_channel_on = False
            friendship_rightside.is_channel_on = False
        db.session.commit()

    def is_channel_on(self, friend):
        return Friends.query.filter_by(friend_id=friend.id,user_id=self.id, is_channel_on=True).count()>0

    def last_message_property(self, friend):
        last_message = Message.query.filter(
            db.or_
                (
                db.and_
                    (
                    Message.sender == self.id, Message.receiver == friend.id
                ),
                db.and_
                    (
                    Message.sender == friend.id, Message.receiver == self.id
                )
            )).order_by(db.desc(Message.timestamp)).first()

        if (last_message is None) or (last_message.sender == friend.id) or (last_message.status == 0):
            return True
        else:
            return False

    def serialize(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'avatar': self.avatar(1)
        }


class Friends(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    friend_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    points = db.Column(db.Integer)
    has_shield = db.Column(db.Boolean)
    is_channel_on = db.Column(db.Boolean)

    def serialize(self):
        friend = User.query.filter_by(id=self.friend_id).first()
        return {
            'user_id': self.user_id,
            'friend_id': self.friend_id,
            'points': self.points,
            'has_shield':self.has_shield,
            'is_channel_on':self.is_channel_on,
            'username_friend':friend.username,
            'avatar_friend':friend.avatar(1)
        }


@login.user_loader
def load_user(id):
    return User.query.get(int(id))


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Integer) #0 --> pendente; 1 --> accettato; 2 --> rifiutato
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    sender = db.Column(db.Integer, db.ForeignKey('user.id'))
    receiver = db.Column(db.Integer, db.ForeignKey('user.id'))
    type = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity': 'notification',
        'polymorphic_on': type
    }


class Message(Notification):
    content = db.Column(db.String(300))
    invested_points = db.Column(db.Integer, default=0)
    __mapper_args__ = {
        'polymorphic_identity': 'message',
    }

    def serialize(self):
        sender = User.query.filter_by(id=self.sender).first()
        receiver = User.query.filter_by(id=self.receiver).first()
        return {
            'id': self.id,
            'status': self.status,
            'timestamp': self.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'sender': self.sender,
            'receiver': self.receiver,
            'content': self.content,
            'invested_points': self.invested_points,
            'username_sender': sender.username,
            'username_receiver': receiver.username,
            'avatar_sender': sender.avatar(1)
        }



class Request(Notification):
    # True --> Friendship, False --> ChannelCommunication
    type_request = db.Column(db.Boolean)
    __mapper_args__ = {
        'polymorphic_identity': 'request',
    }

    def serialize(self):
        username_sender=User.query.filter_by(id=self.sender).first().username
        username_receiver=User.query.filter_by(id=self.receiver).first().username
        return {
            'id': self.id,
            'status': self.status,
            'timestamp': self.timestamp,
            'sender_id': self.sender,
            'receiver_id': self.receiver,
            'type_request': self.type_request,
            'username_sender': username_sender,
            'username_receiver': username_receiver
        }
