var chalk = require('chalk');

function log(text, color){
    console.log(text);
}

exports.error = function(text){
    log(chalk.bold.red("Error: " + text));
};

exports.log = function(text){
    log(chalk.blue(text));
};

exports.success = function(text){
    log(chalk.green.underline(text));
};