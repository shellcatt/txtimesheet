const moment = require('moment');
const fs = require('fs');
const Big = require('big.js');
const ConfigParser = require('configparser');
const colors = require('colors');
const Table = require('cli-table2');
const forex = require('./helpers').forex;

const TableConfigChars = { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
, 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
, 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
, 'right': '' , 'right-mid': '' , 'middle': '' };


// Config
var config = new ConfigParser();
config.read(fs.existsSync('txtimesheet.ini') ? 'txtimesheet.ini' : 'config.ini');

const localCurrency = config.get('main', 'localCurrency');
const feeCurrency = config.get('main', 'feeCurrency');
const exchangeRate = forex(feeCurrency, localCurrency, 1);

const labels = config.get('main', 'labels').split(',');
const defaultFee = parseFloat(config.get('main', 'defaultFee'));
const fees = {};
labels.map(label => fees[label] = parseFloat(config.get('labels', label)).toFixed(2));

const defaultHourlyFee = new Big(defaultFee).toNumber();//.times(exchangeRate);

// Parse Input
const file = process.argv[2] || 'timesheet.txt';

const lines = (fs.readFileSync(file)).toString();
let dayDurations = [];
let logDurations = {};
let labeledDurations = {};
let intraday = null;//'32'; // Failsafe number out of month's range

lines.split("\n").map((line) => {
    // Mon 01 = 3:15
    let dayMatches = line.match(/[A-Za-z]{3}\s[0-9]{2}\s=\s(?<dailyHours>[0-9:]*)/)
    //      1:15 - [call] blah
    let logMatches = line.match(/(?<logHours>[0-9:]+)\s-\s(?<logDesc>.*)/)

    if (dayMatches && dayMatches.groups.dailyHours) {
        // console.debug(matches.groups.dailyHours);
        dayDurations.push(`${dayMatches.groups.dailyHours}:00`);
        intraday = dayMatches;
    } 
    else if (logMatches && logMatches.groups.logHours) {
        logDurations[intraday[0]] = logDurations[intraday[0]] || [];
        logDurations[intraday[0]].push(`${logMatches.groups.logHours}:00`);

        labels.map(label => {
            let rxTags = new RegExp(`\\\[${label}\\\]`, 'i');
            if (String(logMatches.groups.logDesc).match(rxTags)) {
                // console.log(String(logMatches.groups.logDesc).match(rxTags));
                labeledDurations[label] = labeledDurations[label] || [];
                labeledDurations[label].push(`${logMatches.groups.logHours}:00`);
            }
        });
        // console.log(intraday[0], '|', logMatches.groups.logHours, logMatches.groups.logDesc);
    }
});

// Print Output
const table = new Table({
    head: ['Label', 'Total hours', 'Hourly fee*', 'Total due'].map(h => (colors.green(h))),
    chars: TableConfigChars
});

// console.clear();
// console.log(dayDurations, `, or a total of ${dayDurations.length} days`);
console.log(`Total of ${dayDurations.length} days`);

let totalDayDurations = dayDurations.slice(1)
    .reduce((prev, cur) => moment.duration(cur).add(prev), moment.duration(dayDurations[0]));

let totalLabelDurations = {};
Object.keys(labeledDurations).map(label => {
    totalLabelDurations[label] = labeledDurations[label].slice(1)
        .reduce((prev, cur) => moment.duration(cur).add(prev), 
            moment.duration(labeledDurations[label][0])
        )
});

let totalDailyHours = totalDayDurations.asHours();
let salaryPortion = parseFloat(`${totalDailyHours * defaultHourlyFee}`);

console.log(`Daily hours summary: ${totalDailyHours.toFixed(2)}`);
// console.log(colors.grey(`Salary portion (${localCurrency})`) + `: ${salaryPortion.toFixed(2)}`);
console.log(colors.green(`Salary portion (${feeCurrency})` + `: ${salaryPortion.toFixed(2)}`));

let totalHourlyHours = new Big(0);
let hourlyPortion = new Big(0);
Object.keys(labeledDurations).map(label => {
    if (totalLabelDurations[label].asHours() > 0) {
        // console.log(totalLabelDurations[label].asMinutes());
        let totalLabelHours = totalLabelDurations[label].asHours();
        totalHourlyHours = totalHourlyHours.add(totalLabelHours);
        let labelDue = new Big(totalLabelHours).times(fees[label]);
        hourlyPortion = hourlyPortion.add(labelDue);
        table.push([ `[${label}]`, totalLabelHours, `${fees[label]}`, labelDue.toFixed(2) ]);        
    }
    // console.log(`\t[${label}] ${totalLabelDurations[label].asHours()} x ${fees[label]} ${CURR}`);
});
console.log('----------');
console.log(table.toString());
console.log('----------');

// console.log(`Default hourly fee (${CURR}): ${hourlyFee.toFixed(2)}`);

console.log(`Hourly summary: ${totalHourlyHours.toFixed(2)}`);
// console.log(colors.green(`Hourly portion (${localCurrency})`) + `: ${hourlyPortion.toFixed(2)}`);
console.log(colors.green(`Hourly portion (${feeCurrency})`) + `: ${hourlyPortion.toFixed(2)}`);