
var Player = function(){
    var init = function(){
        var a = audiojs.create($('#player'));
        return a[0];
    }
    return init();
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

            audioPlay({
                src: $('a', this).attr('data-src')          
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
        render: render
    }
}


var playlist = Playlist();
var player = null;


function nextPlay() {
    var item = playlist.getNext();
    audioPlay({
        src: item.url
    })
}


function initPlayer() {
    player = Player();
    
    player.trackEnded = function() {
            nextPlay();
        };
    nextPlay();
}


function audioPlay(data) {
    player.load(data.src);
    player.play();
}


function authInfo(response) {
    if (response.session) {
        $('#login_button').hide();
        current_user_id = response.session.mid;
        loadProfile(response.session.mid);
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
    $('#userinfo').html(
        "Музыка " +
        user.last_name + " " +
        user.first_name
        );

    getRecommendAudioList();
}


function getRecommendAudioList() {
    
    VK.api("audio.getRecommendations", {
        count: 100,
        shuffle: 1,
    }, function(data) {
        if (data.response) {
            makePlaylist(data.response);
            nextPlay();
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