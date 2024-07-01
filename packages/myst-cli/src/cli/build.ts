import { Command } from 'commander';
import {
  makeCheckLinksOption,
  makeDocxOption,
  makeForceOption,
  makeJatsOption,
  makePdfOption,
  makeSiteOption,
  makeStrictOption,
  makeTexOption,
  makeAllOption,
  makeNamedExportOption,
  makeHtmlOption,
  makeMecaOptions,
  makeMdOption,
  makeTypstOption,
  makeWatchOption,
  makeCIOption,
  makeExecuteOption,
  makeMaxSizeWebpOption,
  makeDOIBibOption,
} from './options.js';
import { readableName } from '../utils/whiteLabelling.js';

export function makeBuildCommand() {
  const command = new Command('build')
    .description('Build PDF, LaTeX, Word and website exports from MyST files')
    .argument('[files...]', 'list of files to export')
    .addOption(makeExecuteOption('Execute Notebooks'))
    .addOption(makePdfOption('Build PDF output'))
    .addOption(makeTexOption('Build LaTeX outputs'))
    .addOption(makeTypstOption('Build Typst outputs'))
    .addOption(makeDocxOption('Build Docx output'))
    .addOption(makeMdOption('Build MD output'))
    .addOption(makeJatsOption('Build JATS xml output'))
    .addOption(makeMecaOptions('Build MECA zip output'))
    .addOption(makeSiteOption(`Build ${readableName()} site content`))
    .addOption(makeHtmlOption('Build static HTML site content'))
    .addOption(makeAllOption('Build all exports'))
    .addOption(makeDOIBibOption())
    .addOption(makeWatchOption())
    .addOption(makeNamedExportOption('Output file for the export'))
    .addOption(makeForceOption())
    .addOption(makeCheckLinksOption())
    .addOption(makeStrictOption())
    .addOption(makeCIOption())
    .addOption(makeMaxSizeWebpOption());
  return command;
}
