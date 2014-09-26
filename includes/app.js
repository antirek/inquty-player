
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
        var currentIndex = null;        

        var addItem = function(item){
            if(item.aid){
                items.push(item);
            }
        }

        var addItems = function(itemos){            
            for (var i = 0; i < itemos.length; i++) {
                addItem(itemos[i]);
            };
            setCurrentIndex(0);
        }

        var removeItems = function(){
            currentIndex = null;
            items = [];
        }

        var getCurrentItem = function(){

            var item = items[currentIndex];

            $('#playlist a').removeClass('active');            
            $('#playlist a[aid='+item.aid+']').addClass('active');

            return item;
        }        

        var getItemByAid = function(aid){
            var j = 0;            
            for (var i = 0; i < items.length; i++) {
                if(items[i].aid == aid){
                    j = i;                    
                }
            };
            setCurrentIndex(j);
            return getCurrentItem();
        }

        var setCurrentIndex = function(index){
            currentIndex = index;
        }

        var getNext = function(){
            setCurrentIndex(currentIndex + 1);
            return getCurrentItem();
        }

        var getByIndex = function(index){
            setCurrentIndex(index);
            return getCurrentItem();
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
                audioPlay(getItemByAid(aid));
            });

            return li;
        }

        var render = function(){
            var ul = $('<ul>', {
                class: 'list-group nav2'
            });            
            
            for (var i = 0; i < items.length; i++){ 
                ul.append(renderItem(items[i]));
            }
            return ul;
        }

        return {            
            addItems: addItems,
            removeItems: removeItems,
            getNext: getNext,
            getCurrentItem: getCurrentItem,
            getByIndex: getByIndex,        
            render: render,            
        }
    }


    var playlist = Playlist();
    var audio = Audio();
    var visualiser = Visualiser();


    var nextPlay = function() {
        var item = playlist.getNext();        
        audioPlay(item)
    }

    var play = function(){
        var item = playlist.getCurrentItem();
        audioPlay(item);
    }


    var audioPlay = function(item) {
        audio.load(item.url);
        audio.play();
        $('#info').html(item.artist + ' - ' + item.title);
    }


    var init = function() {
        
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
    }();

    var addItems = function(items){
        playlist.removeItems();        
        playlist.addItems(items);
        $('#playlist').html(playlist.render());
    }

    
    return {
        addItems: addItems,        
        init: init,
        nextPlay: nextPlay,
        play: play,
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

    var getSearchAudioList = function(query, callback){
        VK.api("audio.search", {
            count: 100,            
            q: query,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var loadPlaylist = function(type, callback, option){
        switch(type){            
            case 'user':
                getUserAudioList(callback);
                break;
            
            case 'popular':
                getPopularAudioList(callback);
                break;
            
            case 'search':
                getSearchAudioList(option, callback);
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

    var addItemsAndPlay = function(items){
        player.addItems(items);
        player.play();
    }
    
    vki.auth(function(){
        vki.loadPlaylist('recommendations', addItemsAndPlay);
    });


    var bindSelectPlaylists = function(){

        $('#selectPlaylistRecommendations').on('click', function(){
            vki.loadPlaylist('recommendations', addItemsAndPlay);
        });

        $('#selectPlaylistPopular').on('click', function(){
            vki.loadPlaylist('popular', addItemsAndPlay);
        });

        $('#selectPlaylistUser').on('click', function(){
            vki.loadPlaylist('user', addItemsAndPlay);
        });

        $('#selectSearch').on('click', function(){
            $("#searchForm").show();
            $(document).submit(function(e){                
                e.preventDefault();
                var query = $('#searchQuery').val();                

                vki.loadPlaylist('search', function(items){                
                    addItemsAndPlay(items);

                    $('#playlist').show();
                    $("#searchForm").hide();
                }, query);
            });
        });

    }();



    var images = ['/includes/images/1.jpg'];

    var setBackground = function(){
        var image = images[Math.floor(Math.random()*images.length)];        
        $('body').css({
            'background':'url(' + image + ') no-repeat center center fixed',
            'background-size': '100% auto'
        });
    }

    $.ajax({
      url: "http://pixabay.com/api/?username=antirek&key=d1f0c1d17171d78cd832&search_term=sky&image_type=photo&orientation=horizontal&per_page=50",
      success: function(result, status, xhr){        
        images = [];

        for(var i = 0; i < result.hits.length; i++){
            images.push(result.hits[i].webformatURL);
        }        
        
        setBackground();
        setInterval(setBackground, 30000);
      },      
      error: function(xhr, status, error){
        setBackground();
      }
    })


});