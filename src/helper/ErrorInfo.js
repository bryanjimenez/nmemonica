export class ErrorInfo extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    /**
     * @type {*}
     */
    this._info = undefined;
  }

  get info() {
    return this._info;
  }

  set info(info) {
    this._info = info;
  }
}
