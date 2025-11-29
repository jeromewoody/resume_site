/**
 * model.js
 * ---------
 * A clean, single‑pass parser that turns a resume XML document into a
 * JavaScript object that is ready for consumption by a React front‑end.
 *
 * The code:
 *   • Parses the whole XML file only once.
 *   • Uses `xml2js` with `explicitArray: false` so that every element
 *     that occurs only once is returned as a plain value, not an array.
 *   • Normalises the `<summary_item>` values into a simple `summary_items`
 *     array for each position.
 *   • Exposes a promise‑based `build()` method that resolves to the
 *     fully‑built model.
 *
 * Usage (in a Node app, e.g. a Next.js getStaticProps):
 *
 *   const { build } = require('./model');
 *   const resume = await build('/path/to/jerome_woody_resume.xml');
 *   console.log(resume.positions[0].summary_items); // -> ['Bullet 1', 'Bullet 2']
 *
 * The exported object structure matches the JSON you posted in the first
 * message, so the React component can work with it out of the box.
 */

const fs = require('fs');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const { parseStringPromise } = require('xml2js');
const util = require('util');

const loadXml = (file) => new DOMParser().parseFromString(fs.readFileSync(file, 'utf-8'), 'text/xml');

/**
 * Helper that extracts the first matching text node from an XPath query.
 */
const xpathText = (query, node) => {
  const result = xpath.select(query, node);
  return result && result[0] ? result[0].nodeValue : null;
};

/**
 * Main build function.
 * @param {string} filePath Path to the XML resume file.
 * @returns {Promise<object>}  The parsed resume model.
 */
async function build(filePath) {
  const doc = loadXml(filePath);

  // ---------- Contact Info ----------
  const contact_info = {
    name: xpathText('//name/text()', doc),
    phone: xpathText('//phone_number/text()', doc),
    email: xpathText('//email_address/text()', doc),
  };

  // ---------- Skills ----------
  const skills = xpath.select('//skill', doc).map((node) => ({
    skill_id: node.getAttribute('skill_id'),
    skill_value: xpathText('./text()', node),
  }));

  // ---------- Specialization Groups ----------
  const specialization_groups = xpath
    .select('//specialization_group', doc)
    .map((node) => ({
      specialization_groups_label: node.getAttribute('label'),
      specializations: xpath
        .select('./specialization/text()', node)
        .map((n) => n.nodeValue),
    }));

  // ---------- Companies ----------
  const companies = xpath
    .select('//company', doc)
    .map((node) => ({
      company_id: node.getAttribute('company_id'),
      company_name: xpathText('./company_name/text()', node),
      company_location: xpathText('./company_location/text()', node),
    }));

  // ---------- Positions ----------
  const positionsXml = xpath.select('//position', doc);

  // Use xml2js with explicitArray: false to flatten single‑occurrence elements
  const parseOpts = { explicitArray: false, trim: true, normalize: true };

  const positions = await Promise.all(
    positionsXml.map((node) =>
      parseStringPromise(node.toString(), parseOpts).then((obj) => {
        // obj is already the <position> object
        const pos = obj.position; // keep only the <position> element

        // Normalise the summary items – they are now a plain array of strings
        const summary = pos.position_summary?.summary_item ?? [];
        pos.summary_items = Array.isArray(summary) ? summary.map(String) : [];

        // Remove the original nested summary structure to keep the shape
        delete pos.position_summary;

        return pos;
      })
    )
  );

  // ---------- Return full model ----------
  return {
    contact_info,
    skills,
    specialization_groups,
    companies,
    positions,
  };
}

module.exports = { build };