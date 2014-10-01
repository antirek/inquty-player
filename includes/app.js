
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

            $('#playlist li').removeClass('active');            
            $('#playlist a[id='+currentIndex+']').parent().addClass('active');

            return item;
        }        

        var setCurrentIndex = function(index){
            currentIndex = index;
        }

        var getNext = function(){            
            setCurrentIndex(parseInt(currentIndex) + 1);
            return getCurrentItem();
        }

        var getByIndex = function(index){
            setCurrentIndex(index);
            return getCurrentItem();
        }

        var formatSeconds = function(secs){
            var minutes = Math.floor(secs / 60);
            var seconds = secs - minutes * 60;
            seconds = (seconds > 9) ? seconds : '0' + seconds;
            return minutes + ':' + seconds;
        }

        var renderItem = function(index, item){

            var span = $('<span>',{
                class: 'badge pull-right',
                html: formatSeconds(item.duration)
            });

            var anchor = $('<a />', {
                'id': index,                
                'html': item.artist + ' - ' + item.title,
                'href': '#',
            });

            anchor.append(span);

            var li = $('<li />', {
                class: 'list-group-item',
                html: anchor
            });

            li.on('click', function(e) {
                e.preventDefault();
                var id = $('a', this).attr('id');
                var item = getByIndex(parseInt(id));
                play();
            });

            return li;
        }

        var render = function(){
            var ul = $('<ul>', {
                class: 'list-group nav2'
            });            
            
            for (var i = 0; i < items.length; i++){ 
                ul.append(renderItem(i, items[i]));
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
        audioLoad(item);
        audioPlay()
    }

    var play = function(){
        var item = playlist.getCurrentItem();
        audioLoad(item);
        audioPlay();
    }


    var audioPlay = function(item) {
        audio.play();
    }

    var audioLoad = function(item) {
        audio.load(item.url);
        $('#info').html(item.artist + ' - ' + item.title);
    }

    var load = function(){
        var item = playlist.getCurrentItem();
        audioLoad(item);
    }

    var init = function() {
        
        var bindButtons = function(){
            
            $('#togglePlaylist').on('click',function(){
                $('#togglePlaylist').hide();
                $('#playlistContent').show();

                if($('#playlistContent').is(':visible')){
                    setTimeout(function(){
                        $('#playlistContent').hide();
                        $('#togglePlaylist').show();
                    }, 30000)
                }
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
        nextPlay: nextPlay,
        getCurrentItem: playlist.getCurrentItem,
        play: play,
        load: load,
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
                loadProfile(userid);
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
            $('#userinfo').html(user.last_name + " " + user.first_name);
            callback();
        }
    };

    var getRecommendationsPlaylist = function(callback) {
        VK.api("audio.getRecommendations", {
            count: 100,
            shuffle: 1,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var getPopularPlaylist = function(callback) {
        VK.api("audio.getPopular", {
            count: 100,
            shuffle: 1,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var getUserPlaylist = function(callback){
        VK.api("audio.get", {
            count: 100,
            owner_id: userid,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var getSearchPlaylist = function(query, callback){
        VK.api("audio.search", {
            count: 100,            
            q: query,
        }, function(data) {
            if (data.response) {
                callback(data.response);
            }
        });
    }

    var addItemToVk = function(item){
        VK.api('audio.add', {
            audio_id: item.aid,
            owner_id: item.owner_id,
        },
        function(data){
            console.log(data)
        });
    }

    var loadPlaylist = function(options, callback){
        switch(options['type']){            
            case 'user':
                getUserPlaylist(callback);
                break;
            
            case 'popular':
                getPopularPlaylist(callback);
                break;
            
            case 'search':
                getSearchPlaylist(options['query'], callback);
                break;

            case 'recommendations':                
            default:
                getRecommendationsPlaylist(callback);
        }
    }

    return {
        auth: auth,
        loadPlaylist: loadPlaylist,
        addItemToVk: addItemToVk,
    }
}


$(function() {
    
    var vki = vk();
    var player = Player();

    var settings = {
        startPlayOnLoadPlayer: true,
        intervalForBackgroundChange: 600,
    };

    var saveDefaults = function(){
        for(key in settings){
            if(!$.jStorage.get(key)){                
                $.jStorage.set(key, settings[key]);
            }
        }
    }();

    var getFromStorageIfExist = function(key){
        var value = $.jStorage.get(key);
        if(value){
            settings[key] = value;
        }
    }

    var setSettings = function(){
        for(var key in settings){
            getFromStorageIfExist(key);
        }
        
        $('#startPlayOnLoadPlayer').prop('checked', settings['startPlayOnLoadPlayer']);
        $('#intervalForBackgroundChange').val(settings['intervalForBackgroundChange']);
    }();

    var addItemsAndPlay = function(items){
        player.addItems(items);
        player.play();
    }
    
    vki.auth(function(){
        vki.loadPlaylist({type:'recommendations'}, function(items){
            player.addItems(items);

            if(settings['startPlayOnLoadPlayer']){
                player.play();
            }else{
                player.load();
            }

        });
    });

    var bindButtons = function(){

        $('#selectPlaylistRecommendations').on('click', function(){
            vki.loadPlaylist({type:'recommendations'}, addItemsAndPlay);
        });

        $('#selectPlaylistPopular').on('click', function(){
            vki.loadPlaylist({type:'popular'}, addItemsAndPlay);
        });

        $('#selectPlaylistUser').on('click', function(){
            vki.loadPlaylist({type:'user'}, addItemsAndPlay);
        });

        $('#selectSearch').on('click', function(){
            $("#searchForm").toggle();
            $("#searchForm input").focus()
            $(document).submit(function(e){
                e.preventDefault();
                var query = $('#searchQuery').val();

                vki.loadPlaylist({
                    type:'search',
                    query: query
                }, function(items){
                    addItemsAndPlay(items);

                    $('#playlist').show();
                    $("#searchForm").hide();
                });
            });
        });

        $('#addItemToVk').on('click', function(){
            vki.addItemToVk(player.getCurrentItem());
        });

        $('#saveSettings').on('click', function(){
            $.jStorage.set('startPlayOnLoadPlayer', $('#startPlayOnLoadPlayer').prop('checked'));
            $.jStorage.set('intervalForBackgroundChange', $('#intervalForBackgroundChange').val());
           
            $('#settingsModal').modal('hide');
        });

    }();


    Mousetrap.bind('x', function() { player.play(); });
    Mousetrap.bind('b', function() { player.nextPlay(); });
    Mousetrap.bind('a d d', function() { vki.addItemToVk(player.getCurrentItem()); });



    var images = ['/includes/images/1.jpg'];

    var selectRandomImageAndSetBackground = function(){
        var image_url = images[Math.floor(Math.random()*images.length)];
        setBackground(image_url);
    }

    var setBackground = function(url){
        $('body').css({
            'background':'url(' + url + ') no-repeat center center fixed',            
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

            selectRandomImageAndSetBackground();
            setInterval(selectRandomImageAndSetBackground, parseInt(settings['intervalForBackgroundChange'])*1000);
        },      
        error: function(xhr, status, error){
            selectRandomImageAndSetBackground();
        }
    });

});