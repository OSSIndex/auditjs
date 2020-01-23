/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import fetch from 'node-fetch';
import { RequestHelpers } from './RequestHelpers';

const APPLICATION_INTERNAL_ID_ENDPOINT = '/api/v2/applications?publicId=';

const APPLICATION_EVALUATION_ENDPOINT = '/api/v2/evaluation/applications/';

export class IqRequestService {
  constructor(
    readonly user: string, 
    readonly password: string, 
    readonly host: string,
    readonly application: string,
    readonly stage: string,
    readonly timeout: number = 300
  ) {}

  private timeoutAttempts: number = 0;

  public async getApplicationInternalId(): Promise<string> {
    const response = await fetch(
      `${this.host}${APPLICATION_INTERNAL_ID_ENDPOINT}${this.application}`,
      { method: 'get', headers: [this.getBasicAuth(), RequestHelpers.getUserAgent()]});
    if (response.ok) {
      let res = await response.json();
      try {
        return res.applications[0].id;
      } catch(e) {
        throw new Error(`No valid ID on response from Nexus IQ Server, potentially check the public application ID you are using`);
      }
    } else {
      throw new Error(response.type);
    }
  }

  public async submitToThirdPartyAPI(data: any, internalId: string) {
    const response = await fetch(
      `${this.host}/api/v2/scan/applications/${internalId}/sources/auditjs?stageId=${this.stage}`,
      { method: 'post', headers: [this.getBasicAuth(), RequestHelpers.getUserAgent(), ["Content-Type", "application/xml"]], body: data});
    
    if (response.ok) {
      let json = await response.json();
      return json.statusUrl as string;
    } else {
      throw new Error(`Unable to submit to Third Party API`);
    }
  }

  public async submitForEvaluation(data: any, internalId: string) {
    const response = await fetch(
      `${this.host}${APPLICATION_EVALUATION_ENDPOINT}${internalId}`,
      { 
        method: 'post', 
        body: JSON.stringify(data), 
        headers: [this.getBasicAuth(), RequestHelpers.getUserAgent(), ["Content-Type", "application/json"]]
      }
    )
    if (response.ok) {
      let res = await response.json();
      return res.resultsUrl;
    } else {
      return response;
    }
  }

  public async asyncPollForResults(url: string, errorHandler: (error: any) => any, pollingFinished: (body: any) => any) {
    // https://www.youtube.com/watch?v=Pubd-spHN-0
    const response = await fetch(
      url, { 
        method: 'get', 
        headers: [this.getBasicAuth(), RequestHelpers.getUserAgent()]
      });
    const body = response.ok;
    // TODO: right now I think we cover 500s and 400s the same and we'd continue polling as a result. We should likely switch
    // to checking explicitly for a 404 and if we get a 500/401 or other throw an error
    if (!body) {
      this.timeoutAttempts += 1;
      if (this.timeoutAttempts > this.timeout) {
        errorHandler({message: "Polling attempts exceeded, please either provide a higher limit via the command line using the timeout flag, or re-examine your project and logs to see if another error happened"})
      }
      setTimeout(() => this.asyncPollForResults(url, errorHandler, pollingFinished), 1000);
    } else {
      let json = await response.json();
      pollingFinished(json);
    }
  }

  private getBasicAuth(): string[] {
    return ['Authorization', 'Basic ' + Buffer.from(this.user + ":" + this.password).toString('base64')];
  }
}
