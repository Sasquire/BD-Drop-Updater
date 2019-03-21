// ==UserScript==
// @name         BD Drop Updater
// @description  Provides an alternative UI for Bad-Dragon's clearance page
// @version      1.00001
// @author       Teotheel

// @namespace   https://github.com/Sasquire/
// @supportURL  https://github.com/Sasquire/
// @updateURL   https://raw.githubusercontent.com/Sasquire/BD-Drop-Updater/master/user.js
// @downloadURL https://raw.githubusercontent.com/Sasquire/BD-Drop-Updater/master/user.js
// @icon        https://drsh06c3izsth.cloudfront.net/static-media/icons/favicon.png

// @match        https://bad-dragon.com/shop/clearance*
// @match        http://bad-dragon.com/shop/clearance*

// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// ==/UserScript==

const options = {
    full_files: false // true or false -- determines to use larger images or not
}

if(in_iframe() == false){
    init();
}

function in_iframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

async function init(){
    GM_addStyle ( `
    .page--inventory { color:white; }
    #other_iframe {
        width: 80%;
        margin: 20px 10%;
        height: 500px;
        border: 2px solid red;
        display: none;
    }
    .flop { background-color: rgba(200, 0, 0, 0.5); }
    .taken { background-image: linear-gradient(0deg, #fff3, #fff9); }
    .stock { border: 2px solid #fff6; }
    #toy_table {
        min-height: 400px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        align-content: space-around;
    }
    #toy_table > .toy { margin: 5px; padding: 5px; }
    .toy img {
        width: 180px;
        height: 120px;
        border: 2px solid black;
    }
    .info_align { float: right; }
    .taken button, .stock button, .stock .wish_list { display: none; }
    .toy:not(.taken) .wish_list { display:none; }
    #sorting_settings { width: 100px; }
    #time_to_wait { width: 50px; }
    #iframe_destroyer { display:none; }
    ` );
    wait_for_clearance(document.body, '.adoptions__collection').then(further_init);

    async function further_init(){
        const main_posting_area = document.getElementsByClassName('page page--inventory')[0];
        main_posting_area.innerHTML = `
        <style id="situational_css"></style>
        <iframe id="other_iframe" src="about:blank"></iframe>
        <div id="settings">
            <select id="sorting_settings">
                <option value="grouped">grouped</option>
                <option value="ascending">ascending</option>
                <option value="descending">descending</option>
            </select>
            <input type="checkbox" id="downloading_on" checked><span>Keep updating page</span>
            <input type="number" id="time_to_wait" value="20"><span>Time to wait between updates</span>
            <input type="checkbox" id="hide_stock" checked><span>Hide stock toys</span>
            <button id="iframe_destroyer" onclick="document.getElementById('other_iframe').src='about:blank';">
                Dismiss Error
            </button>
        </div>
        <div id="message_box"></div>
        <div id="toy_table"></div>`;

        while(true) {
            const checked = document.getElementById('downloading_on').checked;
            if(checked){
                document.getElementById('message_box').innerText = `Downloading...`;
                await update();
            }
            let i = parseInt(document.getElementById('time_to_wait').value, 10);
            for(/* */; i > 0; i--){
                document.getElementById('message_box').innerText = `Downloading next page in ${i} seconds`;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
}

async function wait_for_clearance(thing_to_watch, class_waiting_for){
    return new Promise((resolve, reject) => {
        if(thing_to_watch.querySelector(class_waiting_for)){
            resolve(thing_to_watch.querySelector(class_waiting_for))
            return;
        }
        new MutationObserver((mutations, observer) => {
            mutations
            .map(o => o.addedNodes)
            .reduce((acc, e) => acc.concat(Array.from(e)), [])
            .map(e => e.querySelector(class_waiting_for))
            .filter(e => e)
            .forEach((e) => {
                observer.disconnect();
                resolve(e);
            });
        }).observe(thing_to_watch, {
            childList: true,
            subtree: true
        });
    })
}

function generate_url(api, page_id, options = {}){
    const url = new URL(`https://bad-dragon.com/${api ? 'api/inventory-toys' : 'shop/clearance'}`);
    if(options.ready_made === undefined || options.ready_made === true){
        url.searchParams.append('type[]', 'ready_made');
    }
    if(options.flop === undefined || options.flop === true){
        url.searchParams.append('type[]', 'flop');
    }

    // hard limit of max_price 300. Is this a garuntee that things wont get pricey?
    url.searchParams.set('price[max]', options.max_price || 300);
    url.searchParams.set('price[min]', options.min_price || 0);

    url.searchParams.set('noAccessories', options.no_accessories || false);
    url.searchParams.set('cumtube', options.cumtube || 'false');
    url.searchParams.set('suctionCup', options.suctionCup || 'false');

    url.searchParams.set('sort[field]', options.sort_field || 'price');
    url.searchParams.set('sort[direction]', options.sort_direction || 'desc');

    url.searchParams.set('page', page_id);
    url.searchParams.set('limit', '60'); // hard limit of 60 from the API

    return url.href;
}

async function get_all_pages(){
    const all_toys = [];
    for(let page_number = 1; true; page_number++){
        const page_details = await get_page(page_number);
        page_details.toys.forEach(e => {
            e.page_number = page_number;
            e.flop = e.flop_reason.length != 0;
        });
        all_toys.push(...page_details.toys);
        if(page_details.page == page_details.totalPages){ break; }
    }
    return all_toys;

    // pages start at one
    async function get_page(page_id, options = {}){
        return fetch(new Request(generate_url(true, page_id, options))).then(res => res.text()).then(JSON.parse);
    }
}

const all_toys = {};
async function update(){
    const toys = await get_all_pages();
    toys.forEach(e => all_toys[e.id] = e);

    // set wishlisted toys
    Object.values(all_toys).forEach(e => {
        const parent = document.getElementById(e.id);
        if(!parent){ e.wish_list = false; return; }
        const box = parent.querySelector('.wish_list.box');
        e.wish_list = box.checked;
    });

    // reset taken
    Object.values(all_toys).forEach(e => {
        e.taken == false;
        const node = document.getElementById(e.id);
        node ? node.classList.remove('taken') : '';
    });

    // assign taken
    const new_ids = toys.map(e => e.id.toString());
    Object.keys(all_toys)
        .filter(e => new_ids.includes(e) == false)
        .forEach(id => {
            all_toys[id].taken = true;
            const node = document.getElementById(id);
            node ? node.classList.add('taken') : '';
        });

    // clear
    const toy_table = document.getElementById('toy_table');
    while(toy_table.children.length > 0){
        toy_table.removeChild(toy_table.children[0]);
    }

    // rebuild
    Object.values(all_toys)
        .sort(sorting_func)
        .map(toy_toy_node)
        .forEach(e => document.getElementById('toy_table').appendChild(e));

    document.getElementById('situational_css').innerHTML = `
        ${document.getElementById('hide_stock').checked ? `
            .toy.stock { display:none; }
        ` : ''}
    `

    function sorting_func(a, b){
        const sorting_method = document.getElementById('sorting_settings').value.charAt(0);
        if(sorting_method == 'a'){
            return a.id - b.id;
        } else if(sorting_method == 'd'){
            return b.id - a.id;
        } else {
            const name_match = a.sku.localeCompare(b.sku);
            if(name_match != 0){ return name_match; }

            const size_match = size_to_int(a.size) - size_to_int(b.size);
            if(size_match != 0){ return size_match; }

            return firm_to_int(a.firmness) - firm_to_int(b.firmness);
        }

        function size_to_int(size){
            switch(size) {
                case 'mini': return 0;
                case 'onesize': return 1;
                case 'small': return 2;
                case 'medium': return 3;
                case 'large': return 4;
                case 'extralarge': return 5;
                default: return -1;
            }
        }

        function firm_to_int(firmness){
            switch(firmness) {
                case '2':
                case '3':
                case '5':
                case '8': return parseInt(firmness);
                default: return 10;
            }
        }
    }
}

function toy_toy_node(toy){
    const temp = document.createElement('div');
    const classlist = [
        'toy',
        toy.flop ? 'flop' : '',
        toy.taken ? 'taken' : '',
        toy.images.length == 0 || toy.images[0].fullFilename.toLowerCase().includes('stock') ? 'stock' : ''
    ].join(' ');
    temp.innerHTML = `
    <div id="${toy.id}" class="${classlist}" data-page="${toy.page_number}">
        <ul class="image_holder" ${toy.flop ? `title="${toy.flop_reason}"` : ''}>
            ${toy.images.length == 0 ?
              '<li><img src="https://drsh06c3izsth.cloudfront.net/static-media/images/image-not-available.svg"></li>' :
              toy.images.map(e => `<li><img src="${options.full_files ? e.fullFilename : e.thumbFilename}"></li>`).join('')
            }
        </ul>
        <div class="info">
            <span>${toy.size} - ${toy.firmness}</span>
            <span class="info_align">${toy.cumtube ? 'CT' : ''} ${toy.suction_cup ? 'SC' : ''}</span>
            <br>
            <span>${toy.sku}</span>
            <span class="info_align">$${toy.price}</span>
            <br>
            <span title="#${toy.id}"><button>Add to Cart</button></span>
            <input class="wish_list box" type="checkbox" ${toy.wish_list ? 'checked' : ''}>
            <span class="wish_list">Wish List</span>
        </div>
    </div>`;
    temp.querySelector('button').addEventListener('click', add_to_cart);
    if(toy.taken == undefined && toy.wish_list == true){
        temp.querySelector('button').click();
        temp.getElementsByClassName('wish_list box')[0].checked = false;
        toy.wish_list = false;
    }
    return temp.firstElementChild;

    async function add_to_cart(){
        const parent = this.parentNode.parentNode.parentNode;
        const page_id = parent.dataset.page;
        const hash = /([0-9a-f]{32})/.exec(parent.querySelector('img').src)[0];

        while(document.getElementById('other_iframe').src != 'about:blank'){
            console.log(hash);
            await new Promise(r => setTimeout(r, 100));
        }

        document.getElementById('other_iframe').style.display = 'initial';
        document.getElementById('iframe_destroyer').style.display = 'initial';
        load_page_iframe(page_id).then(e => {
            const img_node = e.querySelector(`img[src^="https://assets.bad-dragon.com/images/inventorytoys/${hash}"]`);
            img_node.parentNode.parentNode.click();
            e.querySelector('a.button.button--medium.button--block').click();
            wait_for_clearance(document.getElementById('other_iframe').contentDocument.body, '.cart__line-items')
                .then(() => {
                    document.getElementById('other_iframe').src = 'about:blank';
                    document.getElementById('other_iframe').style.display = 'none';
                    document.getElementById('iframe_destroyer').style.display = 'none';
                });
        });

        async function load_page_iframe(page_id){
            return new Promise((resolve, reject) => {
                const iframe = document.getElementById('other_iframe');
                iframe.onload = () => {
                    wait_for_clearance(iframe.contentDocument.body, '.adoptions__collection')
                        .then(resolve)
                }
                iframe.src = generate_url(false, page_id);
            });
        }
    }
}
