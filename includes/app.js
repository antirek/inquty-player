
var Player = function(){

    var Audio = function(){
        var init = function(){            
            var a = audiojs.create($('#player'));
            return a[0];
        }
        return init();
    }

    var Visualiser = function(){

        var analyser = null;
        var canvas = document.getElementById("canvas");
        var canvasContext = canvas.getContext("2d");

        var init = function(){
            var player = document.getElementById('player');

            window.AudioContext = window.AudioContext || window.webkitAudioContext;            
            var audioContext = new AudioContext();
            var source = audioContext.createMediaElementSource(player);
            
            analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            canvasContext.globalAlpha = 0.9;
            canvasContext.fillStyle = "black";
            
            update();
        };

        var update = function(){
            var num_bars = 48;
            
            var data = new Uint8Array(2048);
            analyser.getByteFrequencyData(data);
                          
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);            
            var bin_size = Math.floor(canvas.width / num_bars);

            for (var i = 0; i < num_bars; ++i) {
                var sum = 0;

                for (var j = 0; j < bin_size; ++j) {
                    sum += data[(i * bin_size) + j];
                }
                
                var average = sum / bin_size;
                var bar_width = canvas.width / num_bars;
                var scaled_average = (average / 256) * canvas.height;
                
                canvasContext.fillRect(i * bar_width, 
                    canvas.height, bar_width - 2, -scaled_average);
            }

            requestAnimationFrame(update);
        }

        init();
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

            var span = $('<span>',{
                class:'badge',
                html: item.duration
            });

            var anchor = $('<a />', {
                'id': item.aid,
                'owner_id': item.owner_id,
                'type': "audio/mpeg",
                'data-src': item.url,
                'html': item.artist + ' - ' + item.title,
                'href': '#',
            });

            anchor.append(span);

            var li = $('<li />', {
                class: 'list-group-item disabled',
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
            var ul = $('<ul>',{class:'list-group nav2'});
            
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
    var audio = Audio();
    var visualiser = Visualiser();


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
        audio.trackEnded = function() {
            nextPlay();
        };
        nextPlay();
    };

    var addItems = function(items){
        playlist.addItems(items);
        $('#playlist').append(playlist.render());
    }

    
    return {
        audioPlay: audioPlay,
        addItems: addItems,        
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
            player.initPlayer();
        });
    });

});