import os
basedir = os.path.abspath(os.path.dirname(__file__))
class Config(object):
    SECRET_KEY=os.environ.get('SECRET_KEY') or 'ti sei scordato SECRETE_KEY'
    SQLALCHEMY_DATABASE_URI = (os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'app.db'))+'?check_same_thread=False'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ELEMENTS_PER_PAGE = 5
    THREAD_SLEEPING_TIME = 5 #IN SECONDI
    RESPONSE_TIME_DEADLINE = 2 #IN MINUTI
    TIME_VALUE_OF_A_POINT=0 #IN MINUTI