// set view
$(document).ready(async function() {
    $('.nav-item').removeClass('active');
    $('#practice_nav').addClass('active');
    updateUnderline();

    setTitle('Luyện tập')
        
    if (!checkUserLogin()) {
        $('.user__container').append(createNotLoggedInComponent());

        return
    }

    const response = await userApi("topics");

    if (response && response.topics) {
      topics = response.topics;
    }  

    showTopics(topics)
});

function showTopics(topics) {
    const $userContainer = $('.user__container');

    $userContainer.append(createListTopicComponent(topics))
}