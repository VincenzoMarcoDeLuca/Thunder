from flask import Flask

#si configura l'app tramite l'oggetto Config
from app.config import Config
app = Flask(__name__)
app.config.from_object(Config)

#si aggiunge il database
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
db=SQLAlchemy(app)
migrate=Migrate(app,db)

#si aggiunge il login manager
from flask_login import LoginManager
login = LoginManager(app)
login.login_view = 'auth.login'

#web socket
from flask_socketio import SocketIO
socketio=SocketIO(app)

#utilizzato per la conversione del tempo
from flask_moment import Moment
moment = Moment(app)


#si aggiunge il bluprint relativo all' autenticazione
from app.auth import bp as auth_bp
app.register_blueprint(auth_bp, url_prefix='/auth')

#si aggiunge il bluprint relativo agli errori
from app.errors import bp as errors_bp
app.register_blueprint(errors_bp)

#si aggiunge il bluprint relativo alle funzionalità principali
from app.main import bp as main_bp
app.register_blueprint(main_bp, url_prefix='/')



from app import models