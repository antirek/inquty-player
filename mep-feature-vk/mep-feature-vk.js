(function($) {
    // loop toggle
    MediaElementPlayer.prototype.buildvk = function(player, controls, layers, media) {
        var
                // create the loop button
                vk =
                $('<div class="mejs-button mejs-vk-button" >' +
                '<button type="button"></button>' +
                '</div>')
                // append it to the toolbar
                .appendTo(controls)
                // add a click toggle event
                .click(function() { 

            var audio = $("li.current");
            
            VK.api('audio.add',
                    {
                        aid: audio.attr("id"),
                        oid: audio.attr("oid")
                    },
            function(data) {
                alert('added');
            });            

        });
    }
})(jQuery);