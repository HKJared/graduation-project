//  TODO: Component select
function createSelectComponent(options, id) {
    // Tìm phần tử được chọn (có is_selected = 1)
    const selectedOption = options.find(option => option.is_selected === 1);
    const defaultText = selectedOption ? selectedOption.text : 'Không yêu cầu';
    const defaultValue = selectedOption ? selectedOption.value : 'none';

    // Tạo chuỗi HTML cho phần tử select
    let html = `
        <div class="wo-select relative center" data-val="${defaultValue}" id="${ id || '' }">
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


// TODO: Component alert
function createAlertSuccessComponent(message, buttons) {
    const buttonHtml = buttons
        .map(button => `
            <a href="${button.href}" class="${button.is_main ? 'main-btn' : 'sub-btn'} spa-action">
                ${button.text}
            </a>
        `)
        .join('');

    return `
        <div class="alert-success center">
            <div class="icon__container relative center col item-center">
                <div class="main-icon"><ion-icon name="albums-outline"></ion-icon></div>
                <div class="alert-icon absolute"><ion-icon name="checkmark-outline"></ion-icon></div>
                <span>${message}</span>
                <div class="action row gap-16">
                    ${buttonHtml}
                </div>
            </div>
        </div>
    `;
}

function createAlertNotFoundComponent(message) {
    return `
        <div class="alert-not-found center">
            <div class="icon__container relative center col">
                <div class="main-icon"><ion-icon name="albums-outline"></ion-icon></div>
                <div class="alert-icon absolute"><ion-icon name="alert"></ion-icon></div>
                <span>${ message }</span>
            </div>
        </div> 
    `
}