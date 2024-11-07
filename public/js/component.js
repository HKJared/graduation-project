//  TODO: Component select
function createSelectComponent(options, id) {
    // Tìm phần tử được chọn (có is_selected = 1)
    const selectedOption = options.find(option => option.is_selected === 1);
    const defaultText = selectedOption ? selectedOption.text : 'Không yêu cầu';
    const defaultValue = selectedOption ? selectedOption.value : 'none';

    // Tạo chuỗi HTML cho phần tử select
    let html = `
        <div class="wo-select unlock_condition_type__select relative center" data-val="${defaultValue}" id="${ id || '' }">
            <div class="wo-select_body full-width row item-center flex-box">
                <span class="selected-text">${defaultText}</span>
                <ion-icon name="caret-down-outline"></ion-icon>
            </div>
            <div class="option__list col absolute full-width">
                <ul class="full-height col full-width">
    `;

    // Duyệt qua các option và tạo các li tương ứng
    options.forEach(option => {
        const selectedClass = option.is_selected ? 'selected' : '';
        html += `
            <li class="option__item ${selectedClass}" data-option-val="${option.value}">
                <span>${option.text}</span>
            </li>
        `;
    });

    html += `
                </ul>
            </div>
        </div>
    `;

    return html;
}


// TODO: Component chủ đề
function createTopicComponent(topic) {
    const baseStyle = `background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.024) 0%, rgba(0, 0, 0, 0.174) 57%), url('${ topic.image_url || '/images/image.png'}');`;
    const topicUrl = `/system-exercise-topic?name=${ topic.name }&id=${ topic.id }`;
    
    let actionText = 'Bắt đầu';
    let progressBar = '';

    if (topic.is_completed) {
        actionText = 'Xem lại';
        progressBar = '<div class="progress-bar"><div class="progress-bar__fill" style="width: 100%;"></div></div>';
    } else if (!topic.completed_exercises_percentage) {
        actionText = 'Tiếp tục';
        progressBar = `<div class="progress-bar"><div class="progress-bar__fill" style="width: ${ topic.completed_exercises_percentage }%;"></div></div>`;
    } else if (topic.is_locked) {
        return `
            <div class="topic-item locked" style="${baseStyle}">
                <div class="name"><span>${ topic.name }</span></div>
                <div class="description"><span>${ topic.description }</span></div>
                <div class="action"><a href="${ topicUrl }" class="spa-action">${ actionText }</a></div>
                <div class="locked-screen">
                    <div class="locked-screen__body">
                        <span>LOCKED</span>
                        <div class="icon"><ion-icon name="lock-closed-outline"></ion-icon></div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="topic-item ${topic.is_completed ? 'continue' : ''}" style="${baseStyle}">
            <div class="name"><span>${ topic.name }</span></div>
            <div class="description"><span>${ topic.description }</span></div>
            <div class="action"><a href="${ topicUrl }" class="spa-action">${ actionText }</a></div>
            ${progressBar}
        </div>
    `;
}

function createListTopicComponent(topics) {
    const topicItems = topics.map(topic => topicComponent(topic)).join('');
    return `
    <div class="topic-list">
        ${topicItems}
    </div>
    `;
}