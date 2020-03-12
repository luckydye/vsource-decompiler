import chalk from 'chalk';

global.log = (...str) => {
    console.log('[INFO]', ...str);
}

global.error = (...str) => {
    console.log(chalk.red('[ERROR]', ...str));
}

const Commands = {};

export function command(name, options) {
    Commands[name] = options;
}

export async function main(command, args) {

    command = command || process.argv.slice(2)[0];
    args = args || process.argv.slice(3);

    if(Commands[command]) {
        const result = await Commands[command].execute(...args);
        if(!result && Commands[command].usage) {
            log(Commands[command].description);
            log(`Usage: ${chalk.green(Commands[command].usage)}`);
        }
    } else {
        log('Commands:', chalk.green(Object.keys(Commands).join(", ")));
    }
}
