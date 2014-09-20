var analyser = null;

var canvas = null;
var canvas_context = null;


function update() {
      // This graph has 30 bars.      
      var num_bars = 32;
      // Get the frequency-domain data
      var data = new Uint8Array(2048);
      analyser.getByteFrequencyData(data);
      
      // Clear the canvas
      canvas_context.clearRect(0, 0, 400, 150);

      // Break the samples up into bins
      var bin_size = Math.floor(400 / num_bars);
      for (var i=0; i < num_bars; ++i) {
        var sum = 0;
        for (var j=0; j < bin_size; ++j) {
          sum += data[(i * bin_size) + j];
        }

        // Calculate the average frequency of the samples in the bin
        var average = sum / bin_size;

        // Draw the bars on the canvas
        var bar_width = canvas.width / num_bars;
        var scaled_average = (average / 256) * canvas.height;

        canvas_context.fillRect(i * bar_width, canvas.height, bar_width - 2,
                             -scaled_average);
    }
  }

var Player = function(){

    var Audio = function(){
        var init = function(){
            var a = audiojs.create($('#player'));
            
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            //var context = new window.webkitAudioContext();
            var context = new AudioContext();
            var player = document.getElementById('player');
            var source = context.createMediaElementSource(player);
            analyser = context.createAnalyser();
            source.connect(analyser);
            analyser.connect(context.destination);
            window.setInterval(update, 20);
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
                class: 'list-group-item',
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

    canvas = document.getElementById("canvas");
    canvas_context = canvas.getContext("2d");
    var vki = vk();
    var player = Player();
    
    vki.auth(function(){
        vki.loadPlaylist(function (array) {
            player.addItems(array);
            player.initPlayer();
        });
    });

});