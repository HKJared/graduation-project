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

function createNotLoggedInComponent() {
    return `
        <div class="alert-success center">
            <div class="icon__container relative center col item-center">
                <div class="main-icon"><ion-icon name="person-outline"></ion-icon></ion-icon></div>
                <div class="alert-icon absolute"><ion-icon name="help-outline"></ion-icon></div>
                <span>Hãy đăng nhập để sử dụng dịch vụ này</span>
                <div class="action row gap-16">
                    <a href="/" class="sub-btn spa-action">
                        Quay về trang chủ
                    </a>
                    <a href="/login" class="main-btn">
                        Đăng nhập
                    </a>
                </div>
            </div>
        </div>
    `;
}

// TODO: Component page not pound
function createPageNotPoundComponent() {
    return `
        <div class="full-width full-height center" style="margin-top: auto; margin-bottom: auto;">
            <div class="page-not-found__container col" style="width: 576px; height: 324px; background-color: #F4F4F4; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, .08);">
                <div class="row gap-8 full-width item-center" style="height: 30px; background-color: var(--color-primary); padding: 0 12px;">
                    <div style="height: 10px; width: 10px; border-radius: 50%; background-color: #fff;"></div>
                    <div style="height: 10px; width: 10px; border-radius: 50%; background-color: #fff;"></div>
                    <div style="height: 10px; width: 10px; border-radius: 50%; background-color: #fff;"></div>
                </div>
                <div class="col full-width item-center" style="height: 294px; justify-content: end;">
                    <span style="font-size: 56px; font-weight: 900; color: #9498ac;">404</span>
                    <div class="center" style="width: 354px; height: 150px; background-color: #fff; position: relative;">
                        <div style="width: 50px; height: 50px; position: absolute; top: 0; right: 0; background-image: linear-gradient(45deg, #D9D9E5 50%, #F4F4F4 50%);"></div>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <div style="width: 16px; height: 16px; background-color: #D9D9E5; border-radius: 50%;"></div>
                            <div style="width: 40px; height: 16px; border-bottom: 4px solid #D9D9E5; transform: rotate(180deg) translateY(-30px); "></div>
                            <div style="width: 16px; height: 16px; background-color: #D9D9E5; border-radius: 50%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

// TODO: Component empty display
function createEmptyDisplay() {
    return `
        <div class="empty-component center full-width">
            <img src="<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M121 32C91.6 32 66 52 58.9 80.5L1.9 308.4C.6 313.5 0 318.7 0 323.9L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-92.1c0-5.2-.6-10.4-1.9-15.5l-57-227.9C446 52 420.4 32 391 32L121 32zm0 64l270 0 48 192-51.2 0c-12.1 0-23.2 6.8-28.6 17.7l-14.3 28.6c-5.4 10.8-16.5 17.7-28.6 17.7l-120.4 0c-12.1 0-23.2-6.8-28.6-17.7l-14.3-28.6c-5.4-10.8-16.5-17.7-28.6-17.7L73 288 121 96z"/></svg>" alt="">
        </div>
    `
}