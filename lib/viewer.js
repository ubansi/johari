const $ = require('jquery');
const electron = require('electron');

$(() => {

    let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

    let path = location.search.replace('?', '');
    let img = `<img src="${path}" style="max-height:${height}px;max-width:${width}px;">`;
    $('body').append(img);


    $('img').on('load', () => {
        window.resizeTo($('img').width(), $('img').height());
    });


    $(window).bind('keydown', (e) => {
        if (e.which == 27)
            window.close();
    });
});
