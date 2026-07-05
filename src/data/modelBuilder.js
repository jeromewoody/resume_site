/**
 * modelBuilder.js
 * ----------------
 * A small, reusable helper that turns a slice of an XML document
 * (selected via an XPath query) into an array of JavaScript objects.
 *
 * The original implementation had a handful of problems:
 *   • `xpath` and `dom` were global and never imported correctly
 *   • `element` was never defined
 *   • The static `build()` method had no arguments and just pushed the
 *     constructor argument (`childObj`) without actually reading the XML
 *   • No error handling, no support for async parsing, no type‑checking
 *
 * The new version:
 *   • Uses strict ES‑6 syntax
 *   • Accepts an *XPath expression* and an *XML Document* (or file path)
 *   • Parses each matched node once, turning it into a plain object
 *   • Returns the array of parsed objects (or rejects on error)
 *
 * Usage example (in the same repo that contains `model.js`):
 *
 *   const { ModelBuilder } = require('./modelBuilder');
 *   const { build } = require('./model');
 *
 *   async function loadResume(path) {
 *     const resumeDoc = await build(path);               // uses the main parser
 *     const skillNodes = ModelBuilder.build(
 *       '//skill',
 *       resumeDoc.document // DOMDocument instance that `build()` exposes
 *     );
 *     // skillNodes is an array of objects like:
 *     //   { skill_id: 'php', skill_value: 'PHP' }
 *   }
 *
 *   loadResume('./jerome_woody_resume.xml');
 */

const xpath = require('xpath');
const { DOMParser } = require('xmldom');

module.exports = class ModelBuilder {
  /**
   * @param {string} xpathExpr  – XPath query that selects the nodes you want to turn into objects.
   * @param {Document} xmlDoc   – A `xmldom` Document instance (created via `new DOMParser().parseFromString(...)`).
   * @param {function} nodeMapper  – Optional function that receives a DOM node and returns a plain JS object.
   *                                 If omitted, the node will be returned as-is (still a DOM node).
   */
  constructor(xpathExpr, xmlDoc, nodeMapper) {
    if (!xpathExpr || typeof xpathExpr !== 'string') {
      throw new TypeError('xpathExpr must be a non‑empty string');
    }
    if (!xmlDoc || typeof xmlDoc.documentElement === 'undefined') {
      throw new TypeError('xmlDoc must be a valid DOM Document');
    }
    this.xpathExpr = xpathExpr;
    this.xmlDoc = xmlDoc;
    this.nodeMapper = typeof nodeMapper === 'function' ? nodeMapper : null;
  }

  /**
   * Executes the XPath query, maps each matched node (if mapper provided),
   * and returns an array of objects (or DOM nodes if no mapper).
   *
   * @returns {Array} Array of parsed nodes/objects.
   */
  build() {
    const nodes = xpath.select(this.xpathExpr, this.xmlDoc);
    if (!Array.isArray(nodes) || nodes.length === 0) return [];

    // If a mapper is supplied, apply it; otherwise return raw nodes.
    if (this.nodeMapper) {
      return nodes.map((node) => this.nodeMapper(node));
    }
    return nodes;
  }
};