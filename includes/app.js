
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
        var items = {};
        var current = null;        

        var addItem = function(item){
            if(item.aid){
                items[item.aid] = item;
            }
        }

        var addItems = function(itemos){
            var keys = Object.keys(itemos);
            for (var i = keys.length - 1; i >= 0; i--) {
                addItem(itemos[keys[i]]);
            };
            console.log(items);      
        }

        var removeItems = function(){
            current = null;
            items = {};
        }

        var getCurrent = function(){
            return items[current];
        }

        var setCurrent = function(item){
            current = item.aid;

            $('#playlist a').removeClass('active');            
            $('#playlist a[aid='+current+']').addClass('active');
        }

        var getNext = function(){            
            var index = 0;          
            var keys = Object.keys(items);
            if(!current){
                index = keys[0];
            }else{                
                var j = 0;
                for(var i = 0; i < keys.length - 1; i++){                    
                    if(parseInt(keys[i]) === parseInt(current)){
                        j = i;                        
                    }                    
                }
                index = keys[j + 1];
            }            
            current = index;
            return items[index];
        }

        var getById = function(id){
            return items[id];
        }

        var formatSeconds = function(secs){
            var minutes = Math.floor(secs / 60);
            var seconds = secs - minutes * 60;
            seconds = (seconds > 9) ? seconds : '0'+seconds;
            return minutes + ':' + seconds;
        }

        var renderItem = function(item){

            var span = $('<span>',{
                class: 'badge pull-right',
                html: formatSeconds(item.duration)
            });

            var anchor = $('<a />', {
                'aid': item.aid,
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
                var aid = $('a', this).attr('aid');
                audioPlay(items[aid]);
            });

            return li;
        }

        var render = function(){
            var ul = $('<ul>', {
                class: 'list-group nav2'
            });            
            
            for (key in items){ 
                ul.append(renderItem(items[key]));
            }

            return ul;
        }

        return {
            addItem: addItem,
            addItems: addItems,
            removeItems: removeItems,
            getNext: getNext,
            getById: getById,        
            render: render,
            setCurrent: setCurrent,
        }
    }


    var playlist = Playlist();
    var audio = Audio();
    var visualiser = Visualiser();


    var nextPlay = function() {
        var item = playlist.getNext();        
        audioPlay(item)
    }


    var audioPlay = function(item) {
        playlist.setCurrent(item);
        audio.load(item.url);
        audio.play();
        $('#info').html(item.artist + ' - ' + item.title);
    }


    var initPlayer = function() {
        
        var bindButtons = function(){
            
            $('#togglePlaylist').on('click',function(){
                $('#playlist').toggle();
            });
            
            $('#next').on('click',function(){
                nextPlay();
            });

        }();

        audio.trackEnded = function() {
            nextPlay();
        };

        nextPlay();
    };

    var addItems = function(items){
        playlist.removeItems();        
        playlist.addItems(items);
        $('#playlist').html(playlist.render());
    }

    
    return {
        audioPlay: audioPlay,
        addItems: addItems,        
        initPlayer: initPlayer,
        nextPlay: nextPlay
    }
}


var vk = function(){

    var userid = null;   

    var auth = function(callback){

        VK.init({
            apiId: 3668304
        });

        VK.Auth.getLoginStatus(authInfo);
        VK.UI.button('login_button');

        function authInfo(response) {
            if (response.session) {
                $('#login_button').hide();
                userid = response.session.mid;           
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

    var getPopularAudioList = function(callback) {
        VK.api("audio.getPopular", {
            count: 100,
            shuffle: 1,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var getUserAudioList = function(callback){
        VK.api("audio.get", {
            count: 100,
            owner_id: userid,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var loadPlaylist = function(type, callback){
        switch(type){            
            case 'user':
                getUserAudioList(callback);
                break;
            case 'popular':
                getPopularAudioList(callback);
                break;
            case 'recommendations':                
            default:
                getRecommendAudioList(callback);
        }
    }

    return {
        auth: auth,
        loadPlaylist: loadPlaylist,
    }
}



$(function() {
    
    var vki = vk();
    var player = Player();
    
    vki.auth(function(){
        vki.loadPlaylist('recommendations', function (items) {
            player.addItems(items);
            player.initPlayer();
        });
    });


    var bindSelectPlaylists = function(){

        $('#selectPlaylistRecommendations').on('click', function(){
            vki.loadPlaylist('recommendations', function(items){
                player.addItems(items);
                player.nextPlay();
            });
        });

        $('#selectPlaylistPopular').on('click', function(){
            vki.loadPlaylist('popular', function(items){                
                player.addItems(items);
                player.nextPlay();
            });
        });

        $('#selectPlaylistUser').on('click', function(){
            vki.loadPlaylist('user', function(items){                
                player.addItems(items);
                player.nextPlay();
            });
        });

    }();



    var images = [  '1.jpg', '2.jpg', '3.jpg',
                    '4.jpg', '5.jpg', '6.jpg',
                    '7.jpg', '8.jpg', '9.jpg' ];

    var image = images[Math.floor(Math.random()*images.length)];

    $('body').css('background','url(includes/images/' + image + ')');

});