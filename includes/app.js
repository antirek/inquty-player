
var Player = function(){

    var Audio = function(){
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
    var audio = null;


    var nextPlay = function() {
        var item = playlist.getNext();
        audioPlay({
            src: item.url
        })
    }


    var audioPlay = function(data) {
        audio.load(data.src);
        audio.play();
    }


    var initPlayer = function() {
        audio = Audio();        
        audio.trackEnded = function() {
            nextPlay();
        };
        nextPlay();
    };

    
    return {
        audioPlay: audioPlay,
        addItems: playlist.addItems,
        renderPlaylist: playlist.render,
        initPlayer: initPlayer,
        nextPlay: nextPlay
    }
}

var vk = function(){

    var auth = function(callback){

        VK.init({
            apiId: 3668304
        });

        VK.Auth.getLoginStatus(authInfo);
        VK.UI.button('login_button');

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
                user.last_name + " " + user.first_name
                );
            callback();
        }
    };

    var getRecommendAudioList = function(callback) {
        VK.api("audio.getRecommendations", {
            count: 100,
            shuffle: 1,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    return {
        auth: auth,
        loadPlaylist: getRecommendAudioList,
    }
}



$(function() {

    var vki = vk();
    var player = Player();
    
    vki.auth(function(){
        vki.loadPlaylist(function (array) {
            player.addItems(array);
            $('#playlist').append(player.renderPlaylist());
            player.initPlayer();            
        });
    });

});