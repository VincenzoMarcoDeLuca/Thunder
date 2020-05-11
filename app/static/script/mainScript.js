
window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/script/sw.js');
  }
}


function fillLowerContainer(){
    $("#lowerContainer").show();
}

function loadInfoMessage(friend_id){
    let url="/return_points/"+friend_id;
    $.ajax({
        url: url,
        type:"GET",
        dataType: "json",
        success: function(data){
            //alert("LoadingInfoMessage")
            $.each(data.friends, function(i, item) {
                $("#Points").empty();
                $("#Points").text(item.points);
            });
        },
        error: function(data){alert("error")}
    })
    $("#info").show();
    $("#friends").hide();
    $("#results").hide();
    $("#notices").hide();
}

function loadMessages(friend_id) {
    let url="/return_messages/"+friend_id;
   //alert(friend_id);
   //alert(jsonString);
    $.ajax({
        url : url,
        type: "GET",
        dataType: "json",
        success: function(data) {
            let findNoNoticesAlert = friend_id.toString() + "NoNotices";
            ///alert(findNoNoticesAlert);
            $("#"+findNoNoticesAlert).show();
            let findNoticesAlert = friend_id.toString() + "Notices";
            ///alert(findNoticesAlert);
            $("#"+findNoticesAlert).hide();
            $("#messagesContainer").empty();
            ///$("#lowerContainer").empty();
            $.each(data.messages, function(i, item) {

                let background_color="";

                if (item.status==1)
                    background_color="style=\"background-color: lightgreen\"";
                else if (item.status==2)
                    background_color="style=\"background-color: lightcoral\"";


                if(item.receiver == friend_id) {
                    $("#messagesContainer").append(
                        "<li class='ks-item ks-self'>"+
                                    "<span class='ks-avatar ks-online'>"+
                                        "<img src="+item.avatar_sender+" width='36' height='36' class='rounded-circle'>"+
                                    "</span>"+
                                        "<div class='ks-body' "+background_color+">"+
                                            "<span name='jsonString' style='display: none'>"+JSON.stringify(item)+ "</span>"+
                                            "<div class='ks-header'>"+
                                                "<span class='ks-name'>" +
                                                item.username_sender +
                                                "</span>"+
                                                "<span class='ks-datetime'>" +
                                                moment(item.timestamp).calendar()
                                                 +
                                                "</span>" +
                                            "</div>" +
                                            "<div class='ks-message'>" +
                                             item.content +
                                            "</div>"+
                                        "</div>"+
                                    "</li>"
                    );
                }
                else {
                    let check = "";
                    if (item.status == 0)
                        check = "<button class='listenerChecks'>check</button>"


                    $("#messagesContainer").append(
                        "<li class='ks-item ks-from'>" +
                        "<span class='ks-avatar ks-offline'>" +
                        "<img src=" + item.avatar_sender + "width='36' height='36' class='rounded-circle'>" +
                        "</span>" +
                        "<div class='ks-body' " + background_color + ">" +
                        "<span name='jsonString' style='display: none'>" + JSON.stringify(item) + "</span>" +
                        "<div class='ks-header'>" +
                        "<span class='ks-name'>" +
                        item.username_sender +
                        "</span>" +
                        "<span class='ks-datetime'>" +
                        moment(item.timestamp).calendar()+
                        "</span>" +
                        "</div>" +
                        "<div class='ks-message'>" +
                        item.content +
                        "</div>" +
                        check +
                        "</div>" +
                        "</li>");
                }
            });
            loadInfoMessage(friend_id);
            fillLowerContainer();
            activeListenerChecks();
        },
        error: function(data) { alert("error in loadMessages"); },
        });
}

function activeResultsChannel () {
    $("#channelCommunicationContainer > div").click(function () {
        $("#textAreaMessage").show();
        $("#sendMessageButton").show();
        var activetedResults = $("#channelCommunicationContainer > div.ks-active");
        if (activetedResults.length > 0)
            activetedResults.removeClass("ks-active");
        $(this).addClass("ks-active");
        let jsonString = $("#channelCommunicationContainer > div.ks-active > *[name='jsonString'] ");
        let dataChannel = JSON.parse(jsonString.text());
        loadMessages(dataChannel.friend_id);
        let deadline = $("#deadline");
        if (dataChannel.deadline == "None") {
            deadline.text("No messages to check :)");
            deadline.css("color", "green");
        } else {
            deadline.text(moment(dataChannel.deadline).format('LLLL'));
            deadline.css("color", "red");
        }
        scudo=$("#scudo");
        scudo.prop("disabled", false);
        if (dataChannel.has_shield){
            scudo.prop("checked",true);
            scudo.prop("disabled", true);
        }
        else
        {
            scudo.prop("checked",false);
        }
    })
}

function LoadChannel() {
    let url = '/load_channel';
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        success: function(data){
            let active = false;
            let active_memento;
            if ($("#channelCommunicationContainer > div.ks-active").length > 0) {
                active = true;
                active_memento = $("#channelCommunicationContainer > div.ks-active").attr('id');
            }
            $("#channelCommunicationContainer").empty();
            $.each(data.messages, function(i, item) {
                let NoticesInformation;
                    if (item.notice_unread_message == true){
                        ///alert('Messaggio non letto');
                         NoticesInformation = (
                            "<span id='" +
                                  item.friend_id.toString() +
                                  'NoNotices'+
                        "'class='badge badge-pill badge-light ks-badge ks-notify' style='display: none'>" +
                                   "0"+
                                  "</span>"+
                                  "<span id='" +
                                  item.friend_id.toString() +
                                  'Notices'+
                        "'class='badge badge-pill badge-danger ks-badge ks-notify' >" +
                                  "!" +
                                  "</span>")
                    }
                    else{
                        ///alert('Messaggio letto');
                        NoticesInformation =("<span id='" +
                                  item.friend_id.toString() +
                                  'NoNotices'+
                        "'class='badge badge-pill badge-light ks-badge ks-notify'>" +
                                   "0"+
                                  "</span>"+
                                  "<span id='" +
                                  item.friend_id.toString() +
                                  'Notices'+
                        "'class='badge badge-pill badge-danger ks-badge ks-notify' style='display: none' >" +
                                  "!" +
                                  "</span>")

                    }
                    $("#channelCommunicationContainer").append(
                        "<div class='ks-item' "+
                            "id='" +
                            item.friend_id +
                             "'>"+
                            "<span name='jsonString' style='display: none'>"+JSON.stringify(item)+"</span>"+
                        "<a href='#'>"+
                        //"<div class='Pr'>" +
                        "<span class='ks-avatar'>"+
                            "<img src='" +
                            item.avatar +
                        "' width='36' height='36' class='rounded-circle'>"+
                                  NoticesInformation +
                                  "</span>" +
                                            "<div class='ks-body'>"+
                                                "<div class='ks-name'>"+
                                                   item.username +
                                                   "<span class='ks-datetime'>"+
                                                   moment(item.timestamp).calendar()+
                                                 "</span>"+
                                                 "</div>"+
                                                "<div class='ks-message'>"+
                                                    item.content +
                                                "</div>"+
                                            "</div>"+
                        "</a>"+
                        //"</div>"+
                                    "</li>");
                });
            if(active) {
                $("#" + active_memento).addClass("ks-active");
                loadMessages(active_memento);
            }
            activeResultsChannel();
        },
        error: function(data) {
            alert('caricamento non riuscito');
        },
    });

}



//funzione generica per inviare una richiesta avendone specificato nell'url l'id,
//si aspetta come ritorno un oggetto json con il solo campo response_message
function sendGenericRequest(url)
{
    $.ajax({
        url : url,
        type: "GET",
        dataType: "json",
        success: function(data) {
            alert(data.response_message);
            LoadChannel();
        },
        error: function(data) { alert("error in sendGenericRequest"); },
        });
}

//-----------------------------------------------------------------------//
//----------------------Funzioni--Research-------------------------------//

function activeResultsNotices () {
    $("#resultsContainer > li").click(function () {
        var activetedResults = $("#resultsContainer > li.active");
        if (activetedResults.length > 0)
            activetedResults.removeClass("active");
        $(this).addClass("active");
    })
}


function loadResearch(){
    let pageNumber=$("#CurrentResultsPage").text();
    let searchUsername=$("#search_username").val();
    let url="/return_research?page="+pageNumber+"&searching="+searchUsername;
    $.ajax({
        datatype: "json",
        url: url,
        type: 'GET',
        success: function(data) {
            //Se non esiste una pagina successiva
            if( data.next_page<0) {
                $("#NextResultsPage").hide();
            }
            else {
                $("#NextResultsPage").show();
            }
            $("#resultsContainer").empty();

            //per ogni richiesta
            $.each(data.requests, function(i, item) {
                $("#resultsContainer").append(
                    "<li class=\"list-group-item\">"+
                    "<div name=\"usernameSearched\" id='results-search'>"+item.username+"</div>"+
                    "<span name=\"jsonString\" style=\"display: none\">"+JSON.stringify(item)+"</span>"+
                    "</li>"
                )
            });
            activeResultsNotices();
        },
        error: function(data) {
            alert("error in load notices");
            },
    });
}

//-----------------------------------------------------------------------//
//----------------------Funzioni--Messaggi------------------------------//

//Ogni qualvolta vengono scarivati dei messaggi viene attivato il listener sul bottone di check
//il quale se attivato provvederà a notificare al server la lettura del messaggio
function activeListenerChecks () {
    $(".listenerChecks").click(function () {
        let jsonString=$(this ).parent().find("*[name='jsonString']").text();
        let currentMessage=JSON.parse(jsonString);
        url="/check_message/"+currentMessage.id;
        let this_button=$(this);

        $.ajax({
        url : url,
        type: "GET",
        dataType: "json",
        success: function(data) {
            alert(data.response_message);
            if (data.status_message)
                this_button.parent().css("background-color", "lightgreen");
            else
                this_button.parent().css("background-color", "lightcoral");

            this_button.remove();
        },
        error: function(data) { alert("error in sendGenericRequest"); },
        });
        //$("");
        let active_memento = $("#channelCommunicationContainer > div.ks-active").attr('id');
        loadInfoMessage(active_memento);
    })
}

//-----------------------------------------------------------------------//
//----------------------Funzioni--Notifiche------------------------------//
//Se viene cliccata una notifica viene segnata come attiva
function activeListenerNotices () {
    $("#noticesContainer > li").click(function () {
        activetedNotice = $("#noticesContainer > li.active");
        //se vi è una notifica attivata rimuovo il suo stato di "attiva"
        if (activetedNotice.length > 0)
            activetedNotice.removeClass("active");
        $(this).addClass("active");
    })
}

//carica le notifiche
function loadNotices()
{
    let pageNumber=$("#currentNoticesPage").text();
    let url="/return_requests?page="+pageNumber;
    $.ajax({
        url : url,
        type: "GET",
        dataType: "json",
        success: function(data) {

                //Se non esiste una pagina successiva
                if( data.next_page<0) {
                    $("#nextNoticesPage").hide();
                }
                else {
                    $("#nextNoticesPage").show();
                }

                $("#noticesContainer").empty();

                //per ogni richiesta
                $.each(data.requests, function(i, item) {
                    let description;
                    if(item.type_request)
                        description="friendship";
                    else
                        description="channel";

                    $("#noticesContainer").append(
                        "<li class=\"list-group-item\">"+
                        "<div name=\"sender\">"+item.username_sender+"&nbsp<small name=\"descr\">"+description+"</small></div>"+
                        "<span name=\"jsonString\" style=\"display: none\">"+JSON.stringify(item)+"</span></li>"
                    )
                });

                activeListenerNotices();
        },
        error: function(data) { alert("error in load notices"); },
        });
}

//-----------------------------------------------------------------------//
//----------------------Funzioni--Friends--------------------------------//
function activeListenerFriends () {
    $("#friendsContainer > li").click(function () {
        let activetedFriend= $("#friendsContainer > li.active");
        //se vi è una notifica attivata rimuovo il suo stato di "attiva"
        if (activetedFriend.length > 0)
            activetedFriend.removeClass("active");
        $(this).addClass("active");
    })
}

//carica gli amici
function loadFriends()
{
    let pageNumber=$("#currentFriendsPage").text();
    let url="/return_friends?page="+pageNumber;
    $.ajax({
        url : url,
        type: "GET",
        dataType: "json",
        success: function(data) {
                //Se non esiste una pagina successiva
                if( data.next_page<0) {
                    $("#nextFriendsPage").hide();
                }
                else {
                    $("#nextFriendsPage").show();
                }

                $("#friendsContainer").empty();

                //per ogni richiesta
                $.each(data.friends, function(i, item) {

                    $("#friendsContainer").append(
                        "<li class=\"list-group-item\">\
                            <span class=\"ks-avatar ks-online\">\
                                 <img src=\""+item.avatar_friend+"\" width=\"36\" height=\"36\" class=\"rounded-circle\">\
                            </span>\
                            <span>"+item.username_friend+"</span>\
                            <span name=\"jsonString\" style=\"display: none\">"+JSON.stringify(item)+"</span>\
                        </li>"
                        )
                });

                activeListenerFriends();
        },
        error: function(data) { alert("error in load friends"); },
        });
}

//-----------------------------------------------------------------------//
//----------------------Funzioni--SgamoChat-----------------------------//
function loadSgamo() {
    let url = "/get_unread_messages";
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        success: function (data) {
            console.log(data);
            $("#messagesContainer").empty();
            ///$("#lowerContainer").empty();
            $.each(data.unread_messages, function (i, item) {
                ///alert(item.sender);
                ///alert(item.receiver)
                $("#messagesContainer").append(
                    "<li class='ks-item ks-from'>" +
                    "<span class='ks-avatar ks-offline'>" +
                    "<img src="+item.avatar_sender+" width='36' height='36' class='rounded-circle'>" +
                    "</span>" +
                    "<div class='ks-body' style='background-color: lightcoral'>" +
                    "<div class='ks-header'>" +
                    "<span class='ks-name'>" +
                    "from "+item.username_sender +" to "+item.username_receiver+
                    "</span>" +
                    "<span class='ks-datetime'>" +
                    moment(item.timestamp).calendar() +
                    "</span>" +
                    "</div>" +
                    "<div class='ks-message'>" +
                    item.content +
                    "</div>" +
                    "</div>" +
                    "</li>");
            })
        },
        error: function (data) {
            alert("error in loadSgamo");
        },
    });
}

$(document).ready(function(){

        $.ajax({
        url : "get_my_info",
        type: "GET",
        dataType: "json",
        success: function(data) {
            $("#welcomeName").text(data.my_info.username);
            $("#myInfo").text(JSON.stringify(data));
            $("#MyImage").attr("src",data.my_info.avatar);
            LoadChannel();
        },
        error: function(data) { alert("error in get_my_info"); },
        });

        loadNotices();
//-----------------------------------------------------------------------//
//-------------------------------Research--------------------------------//


        $("#search_button").click(function () {
            loadResearch();
        });

        $("#PrevResultsPage").click(function () {
            let currentPage = $("#CurrentResultsPage");
            let currentPageNumber = parseInt(currentPage.text());
            currentPage.text(--currentPageNumber);
            loadResearch();
            if(currentPageNumber<2)
                 $("#PrevResultsPage").hide();
        });

        $("#NextResultsPage").click(function () {
            let currentPage = $("#CurrentResultsPage");
            let currentPageNumber = parseInt(currentPage.text());
            currentPage.text(++currentPageNumber);
            $("#PrevResultsPage").show();
            loadResearch();
        });

        $("#plus-results-button").click(function () {
            document.getElementById('plus-results-button').style.backgroundColor="#40ff00";
            let url = "/send_request_friendship/";
            let jsonString=$("#resultsContainer > li.active > *[name='jsonString']").text();
            let data=JSON.parse(jsonString);
            url+=data.id;
                $.ajax({
                    url : url,
                    type: "GET",
                    dataType: "json",
                    success: function(data){
                        alert(data.response_message);
                    },
                    error: function(data){
                        alert(data.response_message);
                    },
                })
        });

 $("#minus-results-button").click(function () {
            document.getElementById('minus-results-button').style.backgroundColor="#ff0000";
            let url = "/delete_friend/";
            let jsonString=$("#resultsContainer > li.active > *[name='jsonString']").text();
            let data=JSON.parse(jsonString);
            url+=data.id;
                $.ajax({
                    url : url,
                    type: "GET",
                    dataType: "json",
                    success: function(data){
                        alert(data.response_message);
                        LoadChannel();
                    },
                    error: function(data){
                        alert(data.response_message);
                    },
                })
        });
//-----------------------------------------------------------------------//
//-------------------------------Channel Info----------------------------//

        // Read value on page load
        $("#result b").html($("#customRange").val());

        // Read value on change
        $("#customRange").change(function(){
            $("#result b").html($(this).val());
        });

//-----------------------------------------------------------------------//
//-------------------------------Notifiche-------------------------------//

        // Utilizzato per aprire la pagina delle notifiche
        $("#notices_open").click(function () {
            $("#info").hide();
            $("#friends").hide();
            $("#results").hide();
            $("#notices").show();
            loadNotices();
        });

        //carica la pagina precedente delle notifiche
        $("#prevNoticesPage").click(function () {
            let currentPage=$("#currentNoticesPage");
            let currentPageNumber=parseInt(currentPage.text());
            currentPage.text(--currentPageNumber);
            loadNotices();
            if (currentPageNumber<2)
                $("#prevNoticesPage").hide();
        })

        //carica la pagina successiva delle notifiche
        $("#nextNoticesPage").click(function () {
            let currentPage=$("#currentNoticesPage");
            let currentPageNumber=parseInt(currentPage.text());
            currentPage.text(++currentPageNumber);
            $("#prevNoticesPage").show();
            loadNotices();
        })

        //premo il pulsante di rifiuto notifica
        $("#deniesNotice").click(function () {
                let jsonString=$("#noticesContainer > li.active > *[name='jsonString']").text();
                let data=JSON.parse(jsonString);
                let url;
                //se e' una richiesta di amicizia
                if(data.type_request) {
                    url="/deny_friendship_request/";
                }
                else{
                    url="/deny_channel/";
                }
                url+=data.id;

                sendGenericRequest(url);
                $("#noticesContainer > li.active").remove();
        })


//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

//-----------------------------------------------------------------------//
//------------------------------------FRIEND------------------------------//

// Utilizzato per aprire la pagina delle notifiche
        $("#friend_open").click(function () {
            $("#info").hide();
            $("#friends").show();
            $("#results").hide();
            $("#notices").hide();

            loadFriends();
        });

        //carica la pagina precedente delle notifiche
        $("#prevFriendsPage").click(function () {
            let currentPage=$("#currentFriendsPage");
            let currentPageNumber=parseInt(currentPage.text());
            currentPage.text(--currentPageNumber);
            loadFriends();
            if (currentPageNumber<2)
                $("#prevFriendsPage").hide();
        })

        //carica la pagina successiva delle notifiche
        $("#nextFriendsPage").click(function () {
            let currentPage=$("#currentFriendsPage");
            let currentPageNumber=parseInt(currentPage.text());
            currentPage.text(++currentPageNumber);
            $("#prevFriendsPage").show();
            loadFriends();
        })

        //premo il pulsante di rifiuto notifica
        $("#minus-friends-button").click(function () {
                let jsonString=$("#friendsContainer > li.active > *[name='jsonString']").text();
                let data=JSON.parse(jsonString);
                let url="/destroy_channel/"+data.friend_id;
                sendGenericRequest(url);
        })

        //premo il pulsante di accettazione notifica
        $("#plus-friends-button").click(function () {
                let jsonString=$("#friendsContainer > li.active > *[name='jsonString']").text();
                let data=JSON.parse(jsonString);
                let url="/request_channel/"+ data.friend_id;
                sendGenericRequest(url);
        })

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//

//-----------------------------------------------------------------------//
//----------------------------Messages-----------------------------------//


    let socket = io.connect('http://' + document.domain + ':' + location.port + '/chat');
    socket.on('connect', function() {
        socket.emit('joined', {});
    });
    socket.on('status', function(data) {
        alert(data.response_message);
    })
    socket.on('control', function(data) {
        socket.emit('join_to_room',{friend_id:data.friend_id});
    });

    socket.on('message', function(data) {
        let jsonString=$("#channelCommunicationContainer > div.ks-active > *[name='jsonString'] ");
        let myData=JSON.parse($("#myInfo").text());
        console.log(data);
        if(jsonString.length > 0) {
             let dataChannel=JSON.parse(jsonString.text());

            if (data.sender == myData.my_info.id) //se sono il mittente
            {
                $("#messagesContainer").prepend(
                    "<li class='ks-item ks-self'>"+
                        "<span class='ks-avatar ks-offline'>"+
                            "<img src="+data.avatar_sender+" width='36' height='36' class='rounded-circle'>"+
                        "</span>"+
                            "<div class='ks-body'>"+
                                "<span name='jsonString' style='display: none'>"+JSON.stringify(data)+ "</span>"+
                                "<div class='ks-header'>"+
                                    "<span class='ks-name'>"+
                                    data.username_sender +
                                    "</span>"+
                                    "<span class='ks-datetime'>" +
                                    data.timestamp +
                                    "</span>"+
                                "</div>" +
                                "<div class='ks-message'>"+
                                  data.content +
                                "</div>" +
                            "</div>" +
                        "</li>");
            }
            else //se sono il destinatario
            {
                //se ho la chat aperta con il mittente
                 if (dataChannel.friend_id == data.sender){

                    $("#messagesContainer").prepend(
                    "<li class='ks-item ks-from'>"+
                        "<span class='ks-avatar ks-offline'>"+
                            "<img src="+data.avatar_sender+" width='36' height='36' class='rounded-circle'>"+
                        "</span>"+
                            "<div class='ks-body'>"+
                                "<span name='jsonString' style='display: none'>"+JSON.stringify(data)+ "</span>"+
                                "<div class='ks-header'>"+
                                    "<span class='ks-name'>"+
                                    data.username_sender +
                                    "</span>"+
                                    "<span class='ks-datetime'>" +
                                    data.timestamp +
                                    "</span>"+
                                "</div>" +
                                "<div class='ks-message'>"+
                                  data.content +
                                "</div>" +
                               "<button class='listenerChecks'>check</button>" +
                            "</div>" +
                        "</li>");
                 }
                 else ///Sono il destinatario ed ho chat aperte con altre persone
                 {
                     alert("è arrivato un messaggio da "+data.sender);
                 }
            }
        }
        else ///Sono il destinatario e non ho alcuna chat aperta
        {
            alert("è arrivato un messaggio da "+data.sender);
        }
        ///da spostare
            LoadChannel();
        //se il messaggio arrivato è di un' altra chat
            //notifica l'arriva sulla chat corrispondente
        //else
    });


    $("#sendMessageButton").click(function () {
        let content=$("#textAreaMessage").val();
        if(!content)
            alert("inserire un messaggio");
        else{
            //da aggiornare
            let my_chat_points = $("#Points").text();
            ///alert(my_chat_points);
            let perc_points= $("#PercPoints").text();
            ///alert(perc_points);
            let invested_points = parseInt(my_chat_points*perc_points/100);
            ///alert(invested_points);
            let jsonString=$("#channelCommunicationContainer > div.ks-active > *[name='jsonString'] ").text();
            let dataChannel=JSON.parse(jsonString);
            socket.emit('text', {content: content, receiver:dataChannel.friend_id,invested_points:invested_points});
            loadInfoMessage(dataChannel.friend_id);
        }
    })


    //premo il pulsante di accettazione notifica
        $("#acceptsNotice").click(function () {
                let jsonString=$("#noticesContainer > li.active > *[name='jsonString']").text();
                let data=JSON.parse(jsonString);
                let url;
                //se e' una richiesta di amicizia
                if(data.type_request) {
                    url="/accept_friendship_request/";
                }//se è una richiesta di apertura canale
                else{
                    url="/accept_channel/";
                    socket.emit('notify_change', {friend_id:data.sender_id, username_friend:data.username_sender});
                }
                url+=data.id;

                sendGenericRequest(url);


                $("#noticesContainer > li.active").remove();
        })

//-----------------------------------------------------------------------//
//-----------------------------------------------------------------------//


    $("#search_username").click(function () {
        $("#info").hide();
        $("#friends").hide();
        $("#results").show();
        $("#notices").hide();
    });

    $("#textAreaMessage").click(function(){
        loadInfoMessage();
    });

//-----------------------------------------------------------------------//
//------------------------------SGAMO CHAT-------------------------------//
        $("#sgamo_open").click(function () {
            $("#info").hide();
            $("#textAreaMessage").hide();
            $("#sendMessageButton").hide();
            loadSgamo();
        });

        //gestione dello scudo
        $("#scudo").click(function () {
            let pointsLabel=$("#Points");
            let points=parseInt(pointsLabel.text());
            if (points<5)
            {
                alert("non ha punti sufficienti");
                $(this).prop("checked", false);
            }
            else {
                points -= 5;
                pointsLabel.text(points);
                $(this).prop("disabled", true);

                let jsonString = $("#channelCommunicationContainer > div.ks-active > *[name='jsonString'] ");
                let dataChannel = JSON.parse(jsonString.text());
                let url = "/add_shield/" + dataChannel.friend_id;
                sendGenericRequest(url);
                dataChannel.has_shield=true;
                jsonString.text(JSON.stringify(dataChannel));
            }
        })
});


