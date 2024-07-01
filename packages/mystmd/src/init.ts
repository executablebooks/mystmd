import chalk from 'chalk';
import { Command } from 'commander';
import { Session, init, makeSiteOption, readableName } from 'myst-cli';
import { clirun } from './clirun.js';
import {
  makeProjectOption,
  makeWriteTOCOption,
  makeGithubPagesOption,
  makeGithubCurvenoteOption,
} from './options.js';

export function makeInitCLI(program: Command) {
  const command = new Command('init')
    .description(`Initialize a ${readableName()} project in the current directory`)
    .addOption(makeProjectOption(`Initialize config for ${readableName()} project content`))
    .addOption(makeSiteOption(`Initialize config for ${readableName()} site`))
    .addOption(makeWriteTOCOption())
    .addOption(makeGithubPagesOption())
    .addOption(makeGithubCurvenoteOption())
    .action(clirun(Session, init, program));
  return command;
}

// The default command runs `myst init` with no arguments
export function addDefaultCommand(program: Command) {
  program.action(async (...args: any[]) => {
    if (program.args.length === 0) return clirun(Session, init, program)(args);
    console.error(
      `${chalk.red(`Invalid command: `)}${chalk.bold(program.args.join(' '))}\n\n${chalk.dim(
        'See --help for a list of available commands.\n',
      )}`,
    );
    console.log(program.helpInformation());
    process.exit(1);
  });
}
