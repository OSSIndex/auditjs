/*
 * Copyright 2019-Present Sonatype Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Muncher } from './Muncher';
import path from 'path';
import fs from 'fs';
import { DepGraph } from 'dependency-graph';
import { CycloneDXComponent } from '@sonatype/js-sona-types';
import { PackageURL } from 'packageurl-js';

export class Bower implements Muncher {
  constructor(readonly devDependencies: boolean = false) {}

  public getSbomFromCommand(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  public getGraph(): DepGraph<CycloneDXComponent> | undefined {
    throw new Error('Method not implemented.');
  }

  public isValid(): boolean {
    const tempPath = path.join(process.cwd(), 'bower.json');
    return fs.existsSync(tempPath);
  }

  public async getInstalledDepsAsPurls(): Promise<Array<PackageURL>> {
    const depsArray: Array<PackageURL> = [];
    const file = fs.readFileSync(path.join(process.cwd(), 'bower.json'));
    const json = JSON.parse(file.toString());

    Object.keys(json.dependencies).map((x: string) => {
      const version: string = json.dependencies[x];
      depsArray.push(new PackageURL('bower', undefined, x, version.replace('~', ''), undefined, undefined));
    });

    if (this.devDependencies) {
      Object.keys(json.devDependencies).map((x: string) => {
        const version: string = json.devDependencies[x];
        depsArray.push(new PackageURL('bower', undefined, x, version.replace('~', ''), undefined, undefined));
      });
    }

    return depsArray;
  }
}
