// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as colors from 'colors';
import * as fsx from 'fs-extra';
import * as os from 'os';

import { BaseScriptAction, IBaseScriptActionOptions } from './BaseScriptAction';
import { Utilities } from '../../utilities/Utilities';
import { AlreadyReportedError } from '../../../lib/utilities/AlreadyReportedError';

/**
 * Constructor parameters for GlobalScriptAction.
 */
export interface IGlobalScriptActionOptions extends IBaseScriptActionOptions {
  scriptPath: string;
}

/**
 * This class implements custom commands that are run once globally for the entire repo
 * (versus bulk commands, which run separately for each project).  The action executes
 * a user-defined script file.
 *
 * @remarks
 * Bulk commands can be defined via common/config/command-line.json.  Rush's predefined "build"
 * and "rebuild" commands are also modeled as bulk commands, because they essentially just
 * invoke scripts from package.json in the same way as a custom command.
 */
export class GlobalScriptAction extends BaseScriptAction {
  private _scriptPath: string;

  constructor(
    options: IGlobalScriptActionOptions
  ) {
    super(options);
    this._scriptPath = options.scriptPath;
  }

  public run(): Promise<void> {
    return Promise.resolve().then(() => {
      if (!fsx.existsSync(this.rushConfiguration.rushLinkJsonFilename)) {
        throw new Error(`File not found: ${this.rushConfiguration.rushLinkJsonFilename}` +
          `${os.EOL}Did you run "rush link"?`);
      }

      // Collect all custom parameter values
      const customParameterValues: string[] = [];

      for (const customParameter of this.customParameters) {
        customParameter.appendToArgList(customParameterValues);
      }

      let shellCommand: string = this._scriptPath;
      if (customParameterValues.length > 0) {
        shellCommand += ' ' + customParameterValues.join(' ');
      }

      const exitCode: number = Utilities.executeLifecycleCommand(shellCommand,
        {
          workingDirectory: this.rushConfiguration.rushJsonFolder,
          initCwd: this.rushConfiguration.commonTempFolder,
          handleOutput: false
        }
      );

      if (exitCode > 0) {
        console.log(os.EOL + colors.red(`The script failed with exit code ${exitCode}`));
      }

      process.exitCode = exitCode;

      throw new AlreadyReportedError();
    });
  }

  protected onDefineParameters(): void {
    this.defineScriptParameters();
  }
}
