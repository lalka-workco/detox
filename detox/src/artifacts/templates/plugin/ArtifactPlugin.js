const _ = require('lodash');
const log = require('npmlog');

/***
 * Almost non-opinionated building block for any artifact type
 * You might derive from it if your workflow extremely differs from
 * the already existing artifact plugin templates.
 *
 * @abstract
 */
class ArtifactPlugin {
  constructor({ api }) {
    this.api = api;
    this.enabled = false;
    this.keepOnlyFailedTestsArtifacts = false;
    this._disableReason = '';
  }

  get name() {
    return this.constructor.name;
  }

  disable(reason) {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;
    this._disableReason = reason;
    this._logDisableWarning();
  }

  /**
   * Hook that is called inside device.launchApp() and
   * provides a new pid for the relaunched app for the
   * artifacts that are dependent on pid.
   *
   * @protected
   * @async
   * @param {Object} event - Relaunch app event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Current bundleId
   * @param {number} event.pid - Process id of the running app
   * @return {Promise<void>} - when done
   */
  async onRelaunchApp(event) {}

  /**
   * Hook that is called before any test begins
   *
   * @protected
   * @async
   * @return {Promise<void>} - when done
   */
  async onBeforeAll() {}

  /**
   * Hook that is called before a test begins
   *
   * @protected
   * @async
   * @param {TestSummary} testSummary - has name of currently running test
   * @return {Promise<void>} - when done
   */
  async onBeforeEach(testSummary) {}

  /**
   * Hook that is called before device.resetContentAndSettings() is called
   *
   * @protected
   * @async
   * @param {object} event - has .deviceId inside
   * @return {Promise<void>} - when done
   */
  async onBeforeResetDevice({ deviceId }) {}

  /**
   * Hook that is called after device.resetContentAndSettings() is called
   *
   * @protected
   * @async
   * @param {object} event - has .deviceId inside
   * @return {Promise<void>} - when done
   */
  async onResetDevice({ deviceId }) {}

  /***
   * @protected
   * @async
   * @param {TestSummary} testSummary - has name and status of test that ran
   * @return {Promise<void>} - when done
   */
  async onAfterEach(testSummary) {}

  /**
   * Hook that is called after all tests run
   *
   * @protected
   * @async
   * @return {Promise<void>} - when done
   */
  async onAfterAll() {
    this._logDisableWarning();
  }

  /**
   * Hook that is called on SIGINT and SIGTERM
   *
   * @protected
   */
  onTerminate() {
    this.disable('it was terminated by SIGINT or SIGTERM');

    this.onTerminate = _.noop;
    this.onRelaunchApp = _.noop;
    this.onBeforeResetDevice = _.noop;
    this.onResetDevice = _.noop;
    this.onBeforeAll = _.noop;
    this.onBeforeEach = _.noop;
    this.onAfterEach = _.noop;
    this.onAfterAll = _.noop;
  }

  /***
   * Creates a handle for a test artifact (video recording, log, etc.)
   *
   * @abstract
   * @protected
   * @return {Artifact} - an object with synchronous .discard() and .save(path) methods
   */
  createTestArtifact() {}

  _logDisableWarning() {
    if (!this.enabled && this._disableReason) {
      log.warn('detox-artifacts', 'WARNING! Artifact plugin %s was disabled because %s', this.constructor.name, this._disableReason);
    }
  }

  shouldKeepArtifactOfTest(testSummary) {
    if (this.keepOnlyFailedTestsArtifacts && testSummary.status !== 'failed') {
      return false;
    }

    return true;
  }
}

module.exports = ArtifactPlugin;