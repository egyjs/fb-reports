const os = require("os");
const fs = require("fs");
const puppeteer = require("puppeteer");

let tmpdir = os.tmpdir();
let dir = tmpdir + '/fb-reports';

let cookies = [];
if (fs.existsSync(dir+'/cookies.json')) {
    cookies = require(dir+'/cookies.json');
}

let reported = [];
if (fs.existsSync(dir+"/reported.json")) {
    reported = require(dir + "/reported.json");
}

const pages = async () => { // form DB
    const response = await fetch('https://cdn.jsdelivr.net/gh/egyjs/data/fb-reports-pages.json');

    return await response.json();
}
const getPages = async () => { // form DB filtered by already reported
    const data = await pages();

    return data.filter((page) => {
        return !reported.find((r) => r.id === page.id);
    });
}

const sleep = async () => {
    let time = Math.floor(Math.random() * 10000) + 10000;
    time = 1000;
    console.log(`Sleeping for ${time/1000}s`);
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}

const newBrowser = async (headless = true) => {
    const options = {
        size: {
            width: 1366,
            height: 768
        },
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        args: ['--disable-notifications',`--window-size=${1366},${768}`]
    }

    const browser = await puppeteer.launch({
        ...options,
        headless: headless,
    });

    const page = await browser.newPage();
    await page.setViewport(options.size);

    return {page,browser,options};
}

const login = async (page,browser) => {
    checkDirs();
    // get browser options
    if (!cookies.length) {
        let {page,browser} = await newBrowser(false);

        await page.goto('https://facebook.com/login');
        await page.waitForSelector('#email');


        await page.waitForNavigation({waitUntil: 'networkidle2', timeout: 600000});

        await page.waitForSelector('[aria-label="Your profile"]', {timeout: 600000});

        const currentCookies = await page.cookies();
        fs.writeFileSync(`${dir}/cookies.json`, JSON.stringify(currentCookies));
        console.log('Logged in with credentials');
        await browser.close();
    }else{
        await page.setCookie(...cookies);
        // await page.goto('https://facebook.com');
        console.log('Logged in with cookies');
    }
}

const initReports = async (page) => {
    const pages = await getPages();
    console.log(`Found ${pages.length} pages to report`);
    for (let i = 0; i < pages.length; i++) {
        await page.goto(pages[i].url);
        await report(page,pages[i]);
        console.log(`Navigated to ${pages[i].url}`);
    }
}

const report = async (page,account) => {
    console.log(`Reporting ${account.id} => ${account.url}`);
    // click on the ... dots
    await page.waitForSelector('div[aria-label="See options"]');
    page.click('div[aria-label="See options"]');

    // click on the report button
    await page.waitForSelector('div[role="menuitem"]');
    await page.click('div[role="menuitem"]');

    // click on the 4th option
    await page.waitForSelector('[role="listitem"]');
    await page.click('[role="listitem"]:nth-child(4)');

    // click on the 3rd option
    await page.click('[role="listitem"]:nth-child(3)');

    // click on the submit button
    await page.waitForSelector('[aria-label="Submit"]');
    await page.click('[aria-label="Submit"]');

    await page.waitForSelector('[data-visualcompletion="css-img"]');
    const date = new Date();
    const now = `${date.getDate()}${date.getTime()}`;

    console.log()
    await sleep();
    // store the screenshot
    // let screenshotPath = `${dir}/screenshots/${now}-${account.id}.png`;
    // await page.screenshot({path: screenshotPath});
    console.log(`Reported ${account.id}`);

    // store it to csv, json
    // let data = `${account.id},${account.url},${now},${screenshotPath}\n`;
    // fs.appendFileSync(`${dir}/reported.csv`, data);

    // store it to reported.json
    reported.push(account);
    fs.writeFileSync(`${dir}/reported.json`, JSON.stringify(reported));

    // done
    await sleep();
}

const checkDirs = () => {
    if (!fs.existsSync(tmpdir)){
        fs.mkdirSync(tmpdir);
    }

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    if (!fs.existsSync(dir + '/screenshots')){
        fs.mkdirSync(dir + '/screenshots');
    }

}

module.exports = {
    newBrowser,
    login,
    initReports,
    pages,
    getPages
};