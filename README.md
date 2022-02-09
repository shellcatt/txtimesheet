# TXTimesheet

Turns `.txt` time logs from

```
Mon 01 = 3:15
    1:15 - [call] blah
    1:30 - [dev] blah
Tue 02 = 1:30
    1:30 - [bugfix] blah
    ...
```

into summary

```
Total of 2 days
Daily hours summary: 4.75
----------
 Label     Total hours  Hourly fee*  Total due 
 [call]    1.25         4.50         5.63
 [dev]     1.5          12.00        18.00
 [bugfix]  1.5          -3.00        -4.50
----------
Salary portion (EUR): 38.00
Hourly portion (EUR): 19.13
```

## Install

```
npm install txtimesheet
```

## Config 

* `config.ini`

```
[main]
    localCurrency=BGN
    feeCurrency=EUR
    forex_api=
    date_format=
    time_format=
    labels=call,dev,bugfix
    defaultFee=8
[labels]
    call=4.5
    dev=12
    bugfix=-0.2
    ;...
```
Also searches for `txtimesheet.ini` in local folder (`$CWD`)  

## Run

```
npm start 
```
or 
```
npm start -- timesheet.txt
```
NOTE: You can use the `timesheet.txt` for logs, or delete it and symlink an existing one to the local folder. 


---
## TODO
* V1
  * implement forex API
  * add project tags

* V2
  * move to Blesesed UI

## Author

**Krasimir Gruychev**

* [github/shellcatt](https://github.com/shellcatt)

### License

Copyright © 2016-2022, [Krasimir Gruychev](https://github.com/shellcat).
Released under the [MIT License](LICENSE).