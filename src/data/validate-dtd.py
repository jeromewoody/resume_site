#!/usr/bin/env python3
"""Validate jerome_woody_resume.xml against resume.dtd constraints."""

import xml.etree.ElementTree as ET
import sys
from collections import OrderedDict

def validate(xml_path):
    errors = []
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # 1. Check element order per DTD
    expected_order = ['name', 'phone_number', 'email_address']
    # skill+, specialization_group+, company+, staffing_company+, position+
    # must appear in that order, each group can have multiple items

    # Collect all child elements and their tags
    children = list(root)
    if not children:
        errors.append("Root <resume> has no children")
        return errors

    # Check required children exist and in order
    # name, phone_number, email_address must be first 3
    for i, expected in enumerate(['name', 'phone_number', 'email_address']):
        if i >= len(children):
            errors.append(f"Missing required element: <{expected}>")
        elif children[i].tag != expected:
            errors.append(f"Position {i}: expected <{expected}>, got <{children[i].tag}>")

    # After first 3, must be skill+, then specialization_group+, etc.
    rest = children[3:]
    # Group by tag
    groups = []
    current_tag = None
    current_count = 0
    for child in rest:
        if child.tag != current_tag:
            if current_tag:
                groups.append((current_tag, current_count))
            current_tag = child.tag
            current_count = 1
        else:
            current_count += 1
    if current_tag:
        groups.append((current_tag, current_count))

    expected_groups = ['skill', 'specialization_group', 'company', 'staffing_company', 'position']
    actual_group_tags = [g[0] for g in groups]
    if actual_group_tags != expected_groups:
        errors.append(f"Group order wrong: expected {expected_groups}, got {actual_group_tags}")

    # 2. Check all skill_id values are unique
    skill_ids = set()
    for skill in root.findall('skill'):
        sid = skill.get('skill_id')
        if not sid:
            errors.append(f"<skill> missing skill_id")
        elif sid in skill_ids:
            errors.append(f"Duplicate skill_id: {sid}")
        else:
            skill_ids.add(sid)

    # 3. Check company_id uniqueness
    company_ids = set()
    for company in root.findall('company'):
        cid = company.get('company_id')
        if not cid:
            errors.append(f"<company> missing company_id")
        elif cid in company_ids:
            errors.append(f"Duplicate company_id: {cid}")
        else:
            company_ids.add(cid)

    # 4. Check staffing_id uniqueness
    staffing_ids = set()
    for sc in root.findall('staffing_company'):
        sid = sc.get('staffing_id')
        if not sid:
            errors.append(f"<staffing_company> missing staffing_id")
        elif sid in staffing_ids:
            errors.append(f"Duplicate staffing_id: {sid}")
        else:
            staffing_ids.add(sid)

    # 5. Check position_id uniqueness
    position_ids = set()
    for pos in root.findall('position'):
        pid = pos.get('position_id')
        if not pid:
            errors.append(f"<position> missing position_id")
        elif pid in position_ids:
            errors.append(f"Duplicate position_id: {pid}")
        else:
            position_ids.add(pid)

    # 6. Check all FK references resolve
    all_ids = skill_ids | company_ids | staffing_ids

    for pos in root.findall('position'):
        pid = pos.get('position_id')

        # company_fk must reference a company
        cfk = pos.get('company_fk')
        if not cfk:
            errors.append(f"<position@{pid}> missing company_fk")
        elif cfk not in company_ids:
            errors.append(f"<position@{pid}> company_fk='{cfk}' not found in companies")

        # staffing_fk if present must reference a staffing_company
        sfk = pos.get('staffing_fk')
        if sfk and sfk not in staffing_ids:
            errors.append(f"<position@{pid}> staffing_fk='{sfk}' not found in staffing companies")

        # skills_fk must reference skills
        skills_fk = pos.get('skills_fk', '')
        for sk in skills_fk.split():
            if sk not in skill_ids:
                errors.append(f"<position@{pid}> skill '{sk}' not found in skills")

        # Check position_title exists and has position_type
        title = pos.find('position_title')
        if title is None:
            errors.append(f"<position@{pid}> missing <position_title>")
        else:
            ptype = title.get('position_type')
            if ptype not in ('full_time', 'contract', 'freelance'):
                errors.append(f"<position@{pid}> invalid position_type='{ptype}'")

        # Check date_started exists
        ds = pos.find('date_started')
        if ds is None:
            errors.append(f"<position@{pid}> missing <date_started>")
        else:
            month = ds.get('month')
            year = ds.get('year')
            if month not in ('1','2','3','4','5','6','7','8','9','10','11','12'):
                errors.append(f"<position@{pid}> invalid date_started month='{month}'")
            valid_years = [str(y) for y in range(2002, 2031)]
            if year not in valid_years:
                errors.append(f"<position@{pid}> invalid date_started year='{year}'")

        # Check date_ended if present
        de = pos.find('date_ended')
        if de is not None:
            month = de.get('month')
            year = de.get('year')
            if month not in ('1','2','3','4','5','6','7','8','9','10','11','12'):
                errors.append(f"<position@{pid}> invalid date_ended month='{month}'")
            if year not in valid_years:
                errors.append(f"<position@{pid}> invalid date_ended year='{year}'")

        # Check position_summary exists and has summary_item+
        summary = pos.find('position_summary')
        if summary is None:
            errors.append(f"<position@{pid}> missing <position_summary>")
        elif not summary.findall('summary_item'):
            errors.append(f"<position@{pid}> <position_summary> has no <summary_item>")

    # 7. Check specialization_group has label
    for sg in root.findall('specialization_group'):
        label = sg.get('label')
        if not label:
            errors.append(f"<specialization_group> missing label")
        if not sg.findall('specialization'):
            errors.append(f"<specialization_group@{label}> has no <specialization>")

    # 8. Check company has company_name and company_location
    for company in root.findall('company'):
        cid = company.get('company_id')
        if company.find('company_name') is None:
            errors.append(f"<company@{cid}> missing <company_name>")
        if company.find('company_location') is None:
            errors.append(f"<company@{cid}> missing <company_location>")

    # 9. Check staffing_company has staffing_name and staffing_location
    for sc in root.findall('staffing_company'):
        sid = sc.get('staffing_id')
        if sc.find('staffing_name') is None:
            errors.append(f"<staffing_company@{sid}> missing <staffing_name>")
        if sc.find('staffing_location') is None:
            errors.append(f"<staffing_company@{sid}> missing <staffing_location>")

    return errors

if __name__ == '__main__':
    xml_path = '/home/jerome/Workspace/resume_site/src/data/jerome_woody_resume.xml'
    errors = validate(xml_path)
    if errors:
        print(f"VALIDATION FAILED: {len(errors)} error(s)")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("VALIDATION PASSED: No errors found")
        sys.exit(0)
