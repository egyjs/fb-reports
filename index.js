// dependencies
const os = require('os');
const puppeteer = require('puppeteer');
const helpers = require('./helpers');
const notifier = require('node-notifier');
const path = require("node:path");


// main function
(async () => {

    let {page,browser} = await helpers.newBrowser();

    page.setDefaultNavigationTimeout(3 * 60 * 1000); // 3 minutes

    const pages = await helpers.pages();
    const getPages = await helpers.getPages();

    if (getPages.length){
        await helpers.login(page,browser);
        await helpers.initReports(page);
    }


    // open HTML file
    await page.goto('file://' + __dirname + '/done.html');

    await page.waitForSelector('a');


    await page.evaluate((args) => {
        const btn = document.querySelector('a');
        btn.href =  'file://' + args.__dirname + '/reported.csv';

        const pageCountSpan = document.querySelector('#pages-count');
        pageCountSpan.innerText = `( ${args.count} )`;

        const usernameSpan = document.querySelector('#username');
        usernameSpan.innerText = args.username;

    }, {__dirname,count: getPages.length, username: os.userInfo().username});

    if (getPages.length){
        await notifier.notify({
            title: `شكراً لك ${os.userInfo().username} !`,
            message: `تم الانتهاء من الابلاغ عن عدد ( ${pages.length} ) من الصفحات`,
            sound: true, // Notification sound (true or false)
            wait: false,  // Wait with callback, until user action is taken on notification
            icon: path.join(__dirname, 'facebook.png'), // Absolute path (doesn't work on balloons)
        });
    }else{
        await notifier.notify({
            title: `لا توجد صفحات للابلاغ عنها!`,
            message: `لا توجد صفحات للابلاغ عنها حاليا، اعد المحاولة لاحقا`,
            sound: true, // Notification sound (true or false)
            wait: false,  // Wait with callback, until user action is taken on notification
            icon: path.join(__dirname, 'facebook.png'), // Absolute path (doesn't work on balloons)
        });
    }


    await browser.close();
})();