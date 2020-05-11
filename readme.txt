Istruzioni per l'esecuzione:
- Aprire il progetto con pycharm;
- Impostare l' interprete python;
- Avviare da terminale di pycharm il web server tramite il comando "python thunder.py";

Essendo questa la versione di flask standalone, essa non è in grado di memorizzare più
sessioni utente contemporaneamente, influenzando di fatto il corretto funzionamento del
LoginMenager. Questo si traduce nella non possibilità di avere più utenti loggati contemporaneamente,
all'applicazione. Ciononostante è possibile verificare il corretto funzionamento delle web socket
utilizzate per la messaggistica istantanea, seguendo i passi di seguito descritti:
- Creare due utenti;
- Instaurare tra questi un'amicizia;
- Instaurare tra questi un canale di comunicazione;
- dall'utente a aprire la chat con l'utente b;
- non effettuare il logout da a;
- aprire un'altra pagina web e navigare all'indirizzo http://127.0.0.1:5000/;
- si nota che in automatico ci ritroveremo loggati come utente a;
- effettuare il logout ed effettuare il login come utente b;
- aprire la chat con l'utente a;
- tornare alla pagina dove era aperto l'utente a ed inviare un messaggio a b;
- se si ritorna sulla pagina dell'utente b si può notare che il messaggio è arrivato correttamente;

Di default, al fine di provare il funzionamento del meccanismo di garanzia di lettura messaggio, la
deadline entro il quale leggere il messaggio è impostata a 2 minuti. è possibile in qualsiasi momento
modificare questo range di tempo nel file config.py sotto la voce RESPONSE_TIME_DEADLINE.
