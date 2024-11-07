//set view
$(document).ready(function() {
    $('.menu .main').removeClass('active');
    $('#dashboard').addClass('active');
    
    activateMenuWhenReady('#dashboard')
});