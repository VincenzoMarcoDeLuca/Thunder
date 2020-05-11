import multiprocessing
from app.models import Message,Friends
from app import app, db
import time
from datetime import datetime, timedelta

if __name__ == "__main__":
    print("in main")
    def start_app():
        app.run(threaded=True)

    def prova():
        while True:
            unread_message = Message.query.filter_by(status=0).all()
            for um in unread_message:
                added_minutes = int(
                    app.config["RESPONSE_TIME_DEADLINE"] - app.config["TIME_VALUE_OF_A_POINT"] * um.invested_points)
                if (um.timestamp + timedelta(minutes=added_minutes)) < datetime.utcnow():
                    friendship = Friends.query.filter(
                        db.and_(
                            Friends.user_id == um.receiver, Friends.friend_id == um.sender)
                    ).first()
                    # non vedeva l'amicizia
                    if friendship is not None and friendship.has_shield:
                        print("scudo di {} attivo".format(friendship.user_id))
                        um.status = 1
                        friendship.has_shield = False
                    else:
                        print("il messaggio '{}' sta per essere cancellato".format(um.content))
                        um.status = 2
                    db.session.commit()
            time.sleep(app.config["THREAD_SLEEPING_TIME"])

    p1 = multiprocessing.Process(target=start_app)
    p2 = multiprocessing.Process(target=prova)
    p1.start()
    p2.start()


