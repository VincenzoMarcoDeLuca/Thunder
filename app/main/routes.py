from app.main import bp
from flask import render_template, jsonify, request
from flask_login import current_user, login_required
from app import db, app
from app.models import User, Message, Request, Friends, Notification
from flask_socketio import  join_room

@bp.route('/')
@bp.route('index')
@login_required
def index():
    return render_template('main/index.html', title='Index')


@bp.route('/request_channel/<friend_id>')
def request_channel(friend_id):
    friendship=Friends.query.filter_by(user_id=current_user.id, friend_id=int(friend_id)).first()
    if friendship.is_channel_on:
        return jsonify(response_message='canale di comuncazione già aperto')
    current_request = Request.query.filter_by(sender=current_user.id, receiver=int(friend_id), status=0,
                                              type_request=False).first()
    if current_request is None:
        current_request = Request(sender=current_user.id, receiver=int(friend_id), status=0, type_request=False)
        db.session.add(current_request)
        db.session.commit()
        return jsonify(response_message='richiesta apertura canale inoltrata')
    return jsonify(response_message='richiesta inoltrata precedentemente')


@bp.route('/destroy_channel/<friend_id>')
def destroy_channel(friend_id):
    friend = User.query.get(int(friend_id))
    friendship = Friends.query.filter_by(friend_id=friend.id, user_id=current_user.id).first()
    if not friendship.is_channel_on:
        return jsonify(response_message="non hai un canale di comunicazione aperto con questo utente")
    message_property = current_user.last_message_property(friend)
    if not message_property:
        return jsonify(response_message="non sei stato l'ultimo a riceve un messaggio")
    else:
        friend = User.query.get(int(friend_id))
        current_user.delete_channel(friend)
        return jsonify(response_message="canale disintegrato")


@bp.route('/deny_channel/<request_id>')
def deny_channel(request_id):
    current_request = Request.query.get(int(request_id))
    if current_request is not None:
        current_request.status = 2
        db.session.commit()
    return jsonify(response_message='canale rifiutato correttamente')


@bp.route('/accept_channel/<request_id>')
def accept_channel(request_id):
    current_request = Request.query.get(int(request_id))
    if current_request is not None:
        current_request.status = 1
        db.session.commit()
        current_user.add_channel(User.query.get(current_request.sender))
    new_request = Message(sender=current_user.id, receiver=current_request.sender, status=1,
                          content='Canale instaurato')
    new_request_reverse = Message(sender=current_request.sender, receiver=current_user.id, status=1,
                                  content='Canale instaurato')
    db.session.add(new_request)
    db.session.add(new_request_reverse)
    db.session.commit()
    return jsonify(response_message='canale accettato correttamente')



# ----------------------------------------------------------------------------------------------------#
# ----------------------------------MARCO-------------------------------------------------------------#


@bp.route('/delete_friend/<friend_id>')
def delete_friend(friend_id):
    friend = User.query.get(int(friend_id))
    res = db.session.query(User,Friends).join(Friends,
                                              db.and_(
                                                  Friends.user_id==current_user.id,  Friends.friend_id==friend_id)).first()
    if res is None:
        return jsonify(response_message="Non siete ancora amici")
    message_property = current_user.last_message_property(friend)
    if not message_property:
        return jsonify(
            response_message='non puoi cancellare un legame di amicizia se non sei hai inviato per ultimo un '
                             'messaggio sul canale di comunicazione')
    else:
        friend = User.query.get(int(friend_id))
        current_user.delete_channel(friend)
        current_user.unfriend(friend)
        return jsonify(response_message="amicizia interrotta")


@bp.route('/send_request_friendship/<friend_id>')
def send_request_friendship(friend_id):
    already_exists_request = Request.query.filter_by(sender=current_user.id, receiver=int(friend_id), status=0,
                                                     type_request=True).first()
    if already_exists_request is not None:
        return jsonify(response_message='richiesta già inoltrata precedentemente')
    already_exists_friendship = Friends.query.filter_by(user_id=current_user.id, friend_id=int(friend_id)).first()
    if already_exists_friendship:
        return jsonify(response_message='errore, gia siete amici')
    new_request = Request(sender=current_user.id, receiver=int(friend_id), status=0, type_request=True)
    db.session.add(new_request)
    db.session.commit()
    return jsonify(response_message='richiesta inoltrata correttamente')


@bp.route('/accept_friendship_request/<friendship_request_id>')
def accept_friendship_request(friendship_request_id):
    friendship_request = Request.query.filter_by(id=int(friendship_request_id)).first()
    if friendship_request is not None:
        friendship_request.status = 1
        db.session.commit()
        sender = User.query.filter_by(id=friendship_request.sender).first()
        if sender is None:
            return jsonify(response_message='utente non trovato')
        current_user.add_friend(sender)
    return jsonify(response_message='richiesta accettata')


@bp.route('/deny_friendship_request/<friendship_request_id>')
def deny_friendship_request(friendship_request_id):
    friendship_request = Request.query.filter_by(id=int(friendship_request_id)).first()
    if friendship_request is not None:
        friendship_request.status = 2
        db.session.commit()
    return jsonify(response_message='richiesta rifiutata')

from datetime import timedelta

def useful(all_message):
    deadline = "None"
    unread_message = False
    pendent_message = Message.query.filter_by(
        sender = all_message.User.id, receiver = current_user.id, status = 0).first()
    if pendent_message is not None:
        print("pendent_message is not none")
        added_minutes = int(app.config["RESPONSE_TIME_DEADLINE"] + app.config["TIME_VALUE_OF_A_POINT"] * pendent_message.invested_points)
        timestamp = pendent_message.timestamp + timedelta(minutes=added_minutes)
        deadline = timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')
        unread_message = True

    friendship=Friends.query.filter_by(user_id=current_user.id, friend_id=all_message.User.id).first()

    obj = {
        'username': all_message.User.username,
        'user_id': all_message.User.id,
        'id': all_message.Message.id,
        'sender': all_message.Message.sender,
        'receiver': all_message.Message.receiver,
        'content': all_message.Message.content,
        'timestamp': all_message.Message.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'channelOn': all_message.Friends.is_channel_on,
        'points': all_message.Friends.points,
        'friend_id': all_message.User.id, #Da controllare
        'deadline': deadline,
        'has_shield': friendship.has_shield,
        'notice_unread_message': unread_message,
        'avatar': all_message.User.avatar(1)
    }
    return obj


@bp.route('/load_channel', methods=['GET'])
@login_required
def load_channel():
    all_messages = db.session.query(Message, User, Friends).join(User,
                                                                 db.or_(
                                                                     Message.sender == User.id,
                                                                     Message.receiver == User.id
                                                                 )
                                                                 ).filter(
        db.or_(
            Message.receiver == current_user.id, Message.sender == current_user.id
        )
    ).filter(
        User.id != current_user.id
    ).order_by(db.desc(Message.timestamp)).group_by(User.id).join(Friends,
                                                                  db.and_(
                                                                  Message.sender == Friends.user_id, Message.receiver == Friends.friend_id
                                                                  )
                                                                  ).filter(
        Friends.is_channel_on == True
    ).all()
    return jsonify(messages=[useful(m) for m in all_messages])


@bp.route('/switch_shield')
def switch_shield(my_friend_id):
    current_friendship = db.Friends.query.filter_by(user_id=current_user.id, friend_id=my_friend_id).first
    if current_friendship is not None:
        tmp_boolean = current_friendship.has_shield
        current_friendship.has_shield = not tmp_boolean
    return jsonify(response_message='scudo switchato')


@bp.route('/check_message/<my_message_id>')
def check_message(my_message_id):
    current_message = Notification.query.filter_by(id=int(my_message_id)).first()
    if current_message is not None:
        #da aggiungere-------------------------------------------------
        if current_message.status == 2:
            return jsonify(response_message='messaggio già scaduto', status_message=False)
        #-----------------------------------------------------------------
        friendship = Friends.query.filter_by(user_id=current_user.id, friend_id=current_message.sender).first()
        current_message.status = 1
        db.session.commit()

        if friendship is not None:
            friendship.points = friendship.points + 5
            db.session.commit()
        else:
            return jsonify(response_message='amico non trovato', status_message=False)
    else:
        return jsonify(response_message='messaggio non trovato',status_message=False)
    return jsonify(response_message='punteggio aumentato',status_message=True)


# ----------------------------------------------------------------------------------------------------#
# ----------------------------------------------------------------------------------------------------#

@bp.route('/return_friends', methods=['GET'])
def return_friends():
    page = request.args.get('page', 1, type=int)
    page_of_friends = Friends.query.filter_by(user_id=current_user.id).order_by(
        Friends.friend_id).paginate(page, app.config['ELEMENTS_PER_PAGE'], False)

    next_page = page_of_friends.next_num if page_of_friends.has_next else -1
    return jsonify(friends=[f.serialize() for f in page_of_friends.items], next_page=next_page)


@bp.route('/return_requests', methods=['GET'])
def return_requests():
    page = request.args.get('page', 1, type=int)
    page_of_requests = Request.query.filter(
        db.and_(
            Request.status == 0, Request.receiver == current_user.id
        )
    ).order_by(db.desc(Request.timestamp)).paginate(
        page, app.config['ELEMENTS_PER_PAGE'], False)
    next_page = page_of_requests.next_num if page_of_requests.has_next else -1
    return jsonify(requests=[r.serialize() for r in page_of_requests.items], next_page=next_page)


@bp.route("/return_points/<friend_id>",methods=['GET'])
def return_points(friend_id):
    res = Friends.query.filter(db.and_(Friends.user_id ==current_user.id, Friends.friend_id == friend_id))
    return jsonify(friends=[r.serialize() for r in res])



@bp.route("/return_messages/<friend_id>", methods=['GET'])
def return_message(friend_id):
    all_messages = Message.query.filter(
        db.or_(
            db.and_(
                Message.sender == int(friend_id), Message.receiver == current_user.id
            ),
            db.and_(
                Message.sender == current_user.id, Message.receiver == int(friend_id)
            )
        )
    ).order_by(db.desc(Message.timestamp)).all()

    return jsonify(messages=[m.serialize() for m in all_messages])


@bp.route("/return_research", methods=['GET'])
def return_research():
    page = request.args.get('page', 1, type=int)
    searching = request.args.get('searching', "")
    pattern = "%" + format(searching) + "%"
    page_of_users = User.query.filter(
        db.and_(
            User.username.like(pattern), User.id != current_user.id
        )
    ).paginate(
        page, app.config['ELEMENTS_PER_PAGE'], False)
    next_page = page_of_users.next_num if page_of_users.has_next else -1
    return jsonify(requests=[u.serialize() for u in page_of_users.items], next_page=next_page)


@bp.route("/get_my_info", methods=['GET'])
def get_my_user():
    return jsonify(my_info=current_user.serialize())


@bp.route("/get_unread_messages", methods=['GET'])
def get_unread_messages():
    unread_messages = Message.query.filter(
        db.and_(
            Message.status == 2,
            Message.receiver.in_([f.friend_id for f in current_user.user_friends])
        )
    )
    return jsonify(unread_messages=[m.serialize() for m in unread_messages])


@bp.route("/add_shield/<friend_id>", methods=['GET'])
def add_shield(friend_id):
    friendship = Friends.query.filter_by(user_id=current_user.id, friend_id=int(friend_id)).first()
    if friendship.has_shield:
        return jsonify(response_message="già ti protegge uno scudo con questo utente")
    elif friendship.points < 5:
        return jsonify(response_message="non hai abbastanza punti per attivare uno scudo")
    else:
        friendship.points -= 5
        friendship.has_shield = True
        db.session.commit()
        return jsonify(response_message="scudo attivato correttamente")