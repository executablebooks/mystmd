import { Command } from 'commander';
import {
  makeAllOption,
  makeDocxOption,
  makeHtmlOption,
  makeJatsOption,
  makeMdOption,
  makeMecaOptions,
  makePdfOption,
  makeSiteOption,
  makeTexOption,
  makeTypstOption,
  makeExecuteOption,
  makeYesOption,
  makeLogsOption,
  makeCacheOption,
  makeTempOption,
  makeExportsOption,
  makeTemplatesOption,
} from './options.js';
import { readableName } from '../utils/whiteLabelling.js';

export function makeCleanCommand() {
  const command = new Command('clean')
    .description('Remove exports, temp files and installed templates')
    .argument('[files...]', 'list of files to clean corresponding outputs')
    .addOption(makePdfOption('Clean PDF output'))
    .addOption(makeTexOption('Clean LaTeX outputs'))
    .addOption(makeTypstOption('Clean typst output'))
    .addOption(makeDocxOption('Clean Docx output'))
    .addOption(makeMdOption('Clean MD output'))
    .addOption(makeJatsOption('Clean JATS xml output'))
    .addOption(makeMecaOptions('Clean MECA zip output'))
    .addOption(makeSiteOption(`Clean ${readableName()} site content`))
    .addOption(makeHtmlOption('Clean static HTML site content'))
    .addOption(makeExecuteOption('Clean execute cache'))
    .addOption(makeTempOption())
    .addOption(makeLogsOption('Clean CLI logs'))
    .addOption(makeCacheOption('Clean web request cache'))
    .addOption(makeExportsOption())
    .addOption(makeTemplatesOption())
    .addOption(
      makeAllOption(`Delete all exports, site content, templates, and temp files created by ${readableName()}`),
    )
    .addOption(makeYesOption());
  return command;
}
