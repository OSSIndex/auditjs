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

import expect from '../Tests/TestHelper';
import { AuditIQServer } from './AuditIQServer';
import { ReportStatus } from '../Types/ReportStatus';
import sinon from 'sinon';

describe('AuditIQServer', () => {
  before(() => {
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');
  });

  after(() => {
    sinon.restore();
  });

  it('should provide a true value if IQ Server Results have policy violations', () => {
    const auditIqServer = new AuditIQServer();
    const results = new ReportStatus();
    results.policyAction = 'Failure';
    results.reportHtmlUrl = '';
    const result = auditIqServer.auditThirdPartyResults(results);
    expect(result).to.equal(true);
  });

  it('should provide a true value if IQ Server Results have an isError value', () => {
    const auditIqServer = new AuditIQServer();
    const results = new ReportStatus();
    results.isError = true;
    results.reportHtmlUrl = '';
    const result = auditIqServer.auditThirdPartyResults(results);
    expect(result).to.equal(true);
  });

  it('should provide a false value if IQ Server Results have no policy violations', () => {
    const auditIqServer = new AuditIQServer();
    const results = new ReportStatus();
    results.policyAction = 'None';
    results.reportHtmlUrl = '';
    const result = auditIqServer.auditThirdPartyResults(results);
    expect(result).to.equal(false);
  });
});
