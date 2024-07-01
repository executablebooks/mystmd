#!/usr/bin/env node
import 'core-js/actual'; // This adds backwards compatible functionality for various CLIs
import { Command } from 'commander';
import version from './version.js';
import { makeBuildCLI } from './build.js';
import { makeCleanCLI } from './clean.js';
import { makeInitCLI, addDefaultCommand } from './init.js';
import { makeStartCLI } from './site.js';
import { makeTemplatesCLI } from './templates.js';
import { readableName, isWhiteLabelled } from 'myst-cli';

const program = new Command();

if (isWhiteLabelled()) {
  program.description(
    `${readableName()} is powered by MyST-MD. See https://mystmd.org for more information.`,
  );
}

program.addCommand(makeInitCLI(program));
program.addCommand(makeBuildCLI(program));
program.addCommand(makeStartCLI(program));
program.addCommand(makeCleanCLI(program));
program.addCommand(makeTemplatesCLI(program));
program.version(`v${version}`, '-v, --version', `Print the current version of ${readableName()}`);
program.option('-d, --debug', 'Log out any errors to the console');
addDefaultCommand(program);
program.parse(process.argv);
