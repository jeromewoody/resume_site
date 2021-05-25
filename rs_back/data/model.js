/** 
 * Model.js
 * Version: 1.0.0
 * Description: Contains resume data model.
 * **/

var fs = require('fs'),
xpath = require('xpath'),
dom = require('xmldom').DOMParser,
parseString = require('xml2js').parseString,
util = require('util');

const deserialize = (xml_string) => {

    parseString(xml_string, (err, result) => {
        if(!err) {
            console.log(util.inspect(result, false, null));
        }
    });
}

// Helper Function to inspect contents of an object
const inspect = (obj) => {
    console.log(typeof(obj));
    console.log(util.inspect(obj, false, null));
    return obj;
}

const filterPositions = (type, attrib) => {
    var xpath = '';
    switch(type.toLowerCase) {
        case "company":
            xpath = `//position/[@company_fk='${attrib}']`;
        case "staffing":
            xpath = `//position/[@staffing_fk='${attrib}']`;
        case "position_type":
            xpath = `//position/position_title[@position_type='${attrib}']/parent::position`;
    }
}

const getChildrenAsAarray = (obj) => {
    let childrenArray = [];
    obj.map(child => childrenArray.push(child.data));
    return childrenArray;
}

const resume_xml_file='/home/jerome/resume_site/rs_back/data/jerome_woody_resume.xml';

const resume_xml_string = fs.readFileSync(resume_xml_file, 'utf-8');
const doc = new dom().parseFromString(resume_xml_string);

// Get Header info 

module.exports.contact_info = {};
module.exports.contact_info.name = xpath.select("//name", doc)[0].firstChild.data;
module.exports.contact_info.phone = xpath.select("//phone_number", doc)[0].firstChild.data; 
module.exports.contact_info.email = xpath.select("//email_address", doc)[0].firstChild.data;


module.exports.skills = [];
let skills = xpath.select("//skill", doc);

for(let i=0; i < skills.length; i++){
    let skills_fragment = new dom().parseFromString(skills[i].toString());
    
    module.exports.skills.push({skill_id : xpath.select("//skill/@skill_id", skills_fragment)[0].value,
                   skill_value : xpath.select("//skill/text()", skills_fragment).toString()});
}

module.exports.specialization_groups = [];

let specialization_groups = xpath.select("//specialization_group", doc);

for(let i=0; i < specialization_groups.length; i++) {
    let specialization_group_fragment = new dom().parseFromString(specialization_groups[i].toString());
    
    module.exports.specialization_groups.push({specialization_groups_label: xpath.select("//specialization_group/@label", specialization_group_fragment)[0].value,
                                 specializations: getChildrenAsAarray(xpath.select("//specialization_group/specialization/text()", specialization_group_fragment))});                                 
}
module.exports.companies = [];
let companies = xpath.select("//company", doc);
for(let i=0; i < companies.length; i++) {
    let company_fragment = new dom().parseFromString(companies[i].toString());
    
    module.exports.companies.push({company_id: xpath.select("//company/@company_id", company_fragment)[0].value,
    company_name: xpath.select("//company/company_name/text()", company_fragment).toString(),
    company_location: xpath.select("//company/company_location/text()", company_fragment).toString()});
}

module.exports.positions = [];
let positions = xpath.select("//position", doc);

for(let i=0; i < positions.length; i++) {
    parseString(positions[i].toString(), (err, result) => {
        if(!err) {
            module.exports.positions.push(result);
        }
    });
}

//console.log(util.inspect(m, false, null));
//module.export m;