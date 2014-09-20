
var audio = null;

var Player = function(){
    var state = 'stop';

}


var Playlist = function(){
    var items = [];
    var current = -1;

    var addItem = function(item){
        items.push(item);
    }

    var addItems = function(items){
        for (var i = 0; i < items.length; i++) {
            addItem(items[i]);
        };
    }

    var getNext = function(){
        current = current + 1;
        return (items.length > current) ? items[current] : null;
    }

    var getById = function(id){
        return items[id];
    }

    var getItems = function(){
        console.log(items);
    }

    var renderItem = function(item){
        var anchor = $('<a />', {
            'id': item.aid,
            'owner_id': item.owner_id,
            'type': "audio/mpeg",
            'data-src': item.url,
            'html': item.artist + ' - ' + item.title,
            'href': '#',
        });

        var li = $('<li />', {
            html: anchor
        });

        li.on('click', function(e) {
            e.preventDefault();
            $(this).addClass('playing').siblings().removeClass('playing');

            audioPlay({
                src: $('a', this).attr('data-src'),
                title: $('a', this).html(),
                id: $('a', this).attr('id'),
            });

        });

        return li;
    }

    var render = function(){
        var ul = $('<ul>');
        
        for (var i = 0; i < items.length; i++) {
            ul.append(renderItem(items[i]));
        }

        return ul;
    }

    return {
        addItem: addItem,
        addItems: addItems,
        getNext: getNext,
        getById: getById,
        getItems: getItems,
        render: render
    }
}


var playlist = Playlist();


function startPlayer() {

    el = $('ol a');
    first = $('ol a').attr('data-src');
    $('ol li').first().addClass('playing');

    audioPlay({
        src: el.attr('data-src'),
        title: el.html(),
        id: el.attr('id'),
    })

}


function initPlayer() {
    var a = audiojs.create($('audio'), {
        trackEnded: function() {
            nextPlay();
        }
    });
    audio = a[0];
}


function audioPlay(data) {
    audio.load(data.src);
    $('#current_audio_info').html(data.title);
    audio.play();

    var top = $("#" + data.id).offset().top - 150;
    $('html, body').animate({
        scrollTop: top
    }, 1500);
}

function prevPlay() {
    var prev = $('li.playing').prev();
    if (!prev.length)
        prev = $('ol li').last();
    prev.click();
}

function nextPlay() {
    var next = $('ol li.playing').next();
    if (!next.length)
        next = $('ol li').first();
    next.click();

}

function authInfo(response) {
    if (response.session) {
        $('#login_button').hide();
        current_user_id = response.session.mid;
        loadProfile(response.session.mid);
        console.log(response.session.mid);
    } else {
        $('#login_button').show();
    }
}

function loadProfile(id) {
    VK.api("getProfiles",
        {uids: id},
        loadProfileCallback
        );
}

function loadProfileCallback(data) {
    var profile = data.response[0];
    showProfile(profile);
}


function showProfile(user) {
    console.log("user show profile" + user);
    $('#userinfo').html(
        "Музыка " +
        user.last_name + " " +
        user.first_name
        );

    getRecommendAudioList();
}

function getRecommendAudioList() {

    //var audio1 = getCurrentAudio();
    //var target_audio =  '';//(audio.length > 0) ? audio.attr('oid') + '_' + audio.attr('id') : '';
    //console.log(audio1.attr('oid') + '_' + audio1.attr('id'));
    VK.api("audio.getRecommendations", {
        count: 100,
        shuffle: 1,
        // target_audio: target_audio
    }, function(data) {
        if (data.response) {
            makePlaylist(data.response);
            startPlayer();
        }
    });
}

function makePlaylist(array) {

    playlist.addItems(array);    
    $('#playlist').append(playlist.render());
}

$(function() {
    
    VK.init({
        apiId: 3668304
    });

    VK.Auth.getLoginStatus(authInfo);
    VK.UI.button('login_button');
    
    initPlayer();    

});