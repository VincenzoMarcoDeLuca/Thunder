from flask import session
from flask_socketio import emit, join_room
from app import socketio
from flask_login import current_user
from app.models import Friends,Message
from app import db

@socketio.on('joined', namespace='/chat')
def joined(message):
    #per fretta di cose questo obbrorio è stato necessario, ci scusiamo, un colpo al cuore anche per noi
    alias1 = db.aliased(Friends)
    alias2 = db.aliased(Friends)
    myChannels = db.session.query(alias1, alias2).join(alias1, db.and_(alias1.user_id == alias2.friend_id, alias1.friend_id == alias2.user_id)).filter(db.and_(alias1.is_channel_on==True,alias1.user_id==current_user.id))
    for c in myChannels:
        if c[0].id < c[1].id:
            join_room(str(c[0].id))
            print("utente {} entrato in:{}\n".format(current_user.username, str(c[0].id)))
        else:
            join_room(str(c[1].id))
            print("utente {} entrato in:{}\n".format(current_user.username,str(c[1].id)))
    #Creo un canale di controllo con il server utilizzando l'username
    join_room(current_user.username)

#chiamata quando viene accettata un'apertura canale
@socketio.on('join_to_room', namespace='/chat')
def join_to_room(ws_message):
    channel = Friends.query.filter(
        db.or_(db.and_(Friends.user_id == current_user.id, Friends.friend_id == int(ws_message["friend_id"])),
               db.and_(Friends.user_id == int(ws_message["friend_id"]), Friends.friend_id == current_user.id))).order_by(
        Friends.id).first()
    join_room(str(channel.id))

@socketio.on('notify_change', namespace='/chat')
def notify_change(ws_message):
    emit('control',{"friend_id": current_user.id},ws_message["username_friend"])
    emit('control',{"friend_id": ws_message["friend_id"]},current_user.username)

@socketio.on('text', namespace='/chat')
def text(ws_message):
    last_my_message = Message.query.filter_by(sender=current_user.id, receiver=int(ws_message["receiver"])
                                              ).order_by(db.desc(Message.timestamp)).first()
    print("receiver:{}".format(ws_message["receiver"]))
    channel = Friends.query.filter(db.or_(db.and_(Friends.user_id==current_user.id, Friends.friend_id==int(ws_message["receiver"])),db.and_(Friends.user_id==int(ws_message["receiver"]), Friends.friend_id==current_user.id))).order_by(Friends.id).first()
    print("sta per essere inviato un messaggio sul canale:{}".format(channel.id))

    if (last_my_message is not None) and (last_my_message.status == 0):
        emit('status', {'response_message': 'il tuo ultimo messaggio ancora non è stato letto'}, room=str(channel.id))
    else:
        friendship_my_side = Friends.query.filter(db.and_(Friends.user_id==current_user.id, Friends.friend_id==int(ws_message["receiver"]))).first()
        friendship_my_side.points -= int(ws_message['invested_points'])
        new_message = Message(sender=current_user.id, receiver=int(ws_message["receiver"]), status=0,
                              invested_points=int(ws_message["invested_points"]), content=ws_message["content"])
        db.session.add(new_message)
        db.session.commit()
        new_message = Message.query.filter_by(sender=current_user.id, receiver=int(ws_message["receiver"])).order_by(db.desc(Message.timestamp)).first()
        if new_message is not None:
            emit('message', new_message.serialize(), room=str(channel.id))
