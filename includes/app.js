
var audio = null;

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
    bindKeyboard();
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

function bindKeyboard() {
    // Keyboard shortcuts
    $(document).keydown(function(e) {
        var unicode = e.charCode ? e.charCode : e.keyCode;
        // right arrow
        if (unicode == 39) {
            nextPlay();
            // back arrow
        } else if (unicode == 37) {
            prevPlay();
            // spacebar
        } else if (unicode == 32) {
            audio.playPause();
        }
    });
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

function loadProfile(id) {
    console.log('Load profile' + id);
    VK.api("getProfiles",
        {uids: id},
        loadProfileCallback
        );
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

//function getCurrentAudio() {
//    return $("li.playing");
//}

function makePlaylist(array) {
    for (var i = 0; i < array.length; i++) {
        var anchor = $('<a />', {
            'id': array[i].aid,
            'owner_id': array[i].owner_id,
            'type': "audio/mpeg",
            'data-src': array[i].url,
            'html': array[i].artist + ' - ' + array[i].title,
            'href': '#',
        });

        var playlistItem = $('<li />', {html: anchor});

        playlistItem.on('click', function(e) {
            e.preventDefault();
            $(this).addClass('playing').siblings().removeClass('playing');

            audioPlay({
                src: $('a', this).attr('data-src'),
                title: $('a', this).html(),
                id: $('a', this).attr('id'),
            });

        });

        $("#playlist").append(playlistItem);

    }
}

$(function() {
    VK.init({
        apiId: 3668304
    });
    VK.Auth.getLoginStatus(authInfo);
    VK.UI.button('login_button');
    initPlayer();

    $(document).on('scroll', function() {
        if ($('#bar')[0].offsetTop < $(document).scrollTop()) {
            $("#bar").css({position: "fixed", top: 0});
        }
        if ($(document).scrollTop() < $("#position-saver")[0].offsetTop) {
            $("#bar").css({position: "static", top: 0});
        }
    });

});