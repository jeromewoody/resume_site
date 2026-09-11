#!/usr/bin/env python3
"""Analyze resume career data for D3.js visualization potential."""

from collections import Counter, defaultdict
from datetime import datetime

# Parse the 18 positions
positions = [
    {"id": "dis2022", "company": "discogs", "staffing": None, "skills": ["html", "react", "css", "javascript", "python", "nodejs", "xml"], "start": "2022-01", "end": None, "type": "full_time"},
    {"id": "amz2019", "company": "amazon", "staffing": "creative_circle", "skills": ["html", "jsp", "css", "javascript", "java_servlets", "nodejs"], "start": "2019-07", "end": "2020-02", "type": "contract"},
    {"id": "amz0218", "company": "amazon", "staffing": "aditi", "skills": ["html", "css", "xml", "xpath", "xslt", "javascript", "ruby", "python"], "start": "2018-02", "end": "2019-02", "type": "contract"},
    {"id": "rat0917", "company": "rational_interaction", "staffing": None, "skills": ["python", "sql"], "start": "2017-09", "end": "2017-10", "type": "freelance"},
    {"id": "riv0616", "company": "river_logic", "staffing": None, "skills": ["javascript", "typescript", "csharp", "css", "less", "html"], "start": "2016-06", "end": "2017-07", "type": "full_time"},
    {"id": "amz0815", "company": "amazon", "staffing": "creative_circle", "skills": ["javascript", "html", "css", "freemarker", "java"], "start": "2015-08", "end": "2016-01", "type": "contract"},
    {"id": "exp0814", "company": "expedia", "staffing": "aim_consulting", "skills": ["javascript", "html", "css", "perl", "jquery"], "start": "2014-08", "end": "2015-05", "type": "contract"},
    {"id": "exp1113", "company": "expedia", "staffing": "aim_consulting", "skills": ["javascript", "html", "css", "freemarker", "jquery"], "start": "2013-11", "end": "2014-06", "type": "contract"},
    {"id": "epi0113", "company": "epicenter_networks", "staffing": None, "skills": ["php", "mysql", "html", "css", "javascript", "jquery"], "start": "2013-01", "end": "2013-08", "type": "full_time"},
    {"id": "zum0412", "company": "zumiez", "staffing": "lg_consulting", "skills": ["php", "html", "css", "javascript"], "start": "2012-04", "end": "2013-01", "type": "contract"},
    {"id": "quo0811", "company": "quorum_review", "staffing": "aim_consulting", "skills": ["html", "css", "javascript"], "start": "2011-08", "end": "2012-04", "type": "contract"},
    {"id": "asa0711", "company": "asaalh", "staffing": None, "skills": ["python", "sql"], "start": "2011-07", "end": "2012-02", "type": "freelance"},
    {"id": "ocl0510", "company": "oclc", "staffing": "parker", "skills": ["java", "javascript", "ruby", "python", "tcl", "groovy"], "start": "2010-05", "end": "2010-10", "type": "contract"},
    {"id": "zaa0110", "company": "zaaz", "staffing": "greythorn", "skills": ["php", "html", "css", "javascript"], "start": "2010-01", "end": "2010-04", "type": "contract"},
    {"id": "sea1209", "company": "seattle_times", "staffing": "rylem", "skills": ["html", "css"], "start": "2009-12", "end": "2010-01", "type": "contract"},
    {"id": "all0809", "company": "all_stars_directory", "staffing": "lg_consulting", "skills": ["html", "css", "javascript"], "start": "2009-08", "end": "2009-09", "type": "contract"},
    {"id": "gri1106", "company": "grist", "staffing": None, "skills": ["html", "css", "javascript", "perl", "php", "sql", "mysql", "postgresql", "codeigniter", "xml"], "start": "2006-11", "end": "2009-04", "type": "full_time"},
    {"id": "seu082005", "company": "seattle_university", "staffing": None, "skills": ["html", "css", "xml", "xpath", "xpointer", "xslt", "php", "mysql", "java"], "start": "2005-02", "end": "2005-08", "type": "full_time"},
]

total = len(positions)
print(f"TOTAL POSITIONS: {total}")
print("=" * 70)

# 1. SKILL FREQUENCY
print("\n1. SKILL FREQUENCY ANALYSIS")
print("-" * 40)
skill_counts = Counter()
for p in positions:
    skill_counts.update(p["skills"])

for skill, count in skill_counts.most_common():
    pct = count / total * 100
    bar = "█" * int(pct / 2)
    print(f"  {skill:20s} {count:2d} ({pct:5.1f}%)  {bar}")

# Group by category
print("\n  --- By Category ---")
categories = {
    "HTML/CSS": ["html", "css", "html5", "xhtml", "less"],
    "JavaScript": ["javascript", "jquery", "react", "nodejs", "typescript"],
    "Backend": ["php", "python", "java", "java_servlets", "jsp", "asp", "cold_fusion", "ruby", "csharp", "groovy", "freemarker"],
    "Databases": ["sql", "mysql", "postgresql"],
    "XML/Data": ["xml", "xpath", "xpointer", "xquery", "xslt"],
    "Other": ["perl", "tcl", "r", "ccplus", "sas"],
    "Frameworks": ["codeigniter"],
}
for cat, skills in categories.items():
    present = [s for s in skills if skill_counts[s] > 0]
    total_cat = sum(skill_counts[s] for s in skills)
    if present:
        print(f"  {cat:20s} {total_cat:2d} uses across: {', '.join(present)}")

# 2. SKILL CO-OCCURRENCE
print("\n2. SKILL CO-OCCURRENCE MATRIX (Top Pairs)")
print("-" * 40)
cooccurrence = Counter()
for p in positions:
    skills = p["skills"]
    for i in range(len(skills)):
        for j in range(i+1, len(skills)):
            pair = tuple(sorted([skills[i], skills[j]]))
            cooccurrence[pair] += 1

for pair, count in cooccurrence.most_common(20):
    pct = count / total * 100
    print(f"  {pair[0]:20s} + {pair[1]:20s} = {count:2d} ({pct:5.1f}%)")

# 3. SKILLS OVER TIME
print("\n3. SKILLS OVER TIME (by year)")
print("-" * 40)
year_skills = defaultdict(set)
for p in positions:
    start_year = int(p["start"].split("-")[0])
    end_year = int(p["end"].split("-")[0]) if p["end"] else 2022
    for y in range(start_year, end_year + 1):
        year_skills[y].update(p["skills"])

for year in sorted(year_skills.keys()):
    skills = sorted(year_skills[year])
    print(f"  {year}: {', '.join(skills)}")

# 4. EMPLOYMENT TYPE DISTRIBUTION
print("\n4. EMPLOYMENT TYPE DISTRIBUTION")
print("-" * 40)
type_counts = Counter(p["type"] for p in positions)
for t, c in type_counts.most_common():
    pct = c / total * 100
    print(f"  {t:15s} {c:2d} ({pct:5.1f}%)")

# 5. CAREER TIMELINE ANALYSIS
print("\n5. CAREER TIMELINE (Gaps & Overlaps)")
print("-" * 40)
sorted_pos = sorted(positions, key=lambda p: p["start"])
for p in sorted_pos:
    start = datetime.strptime(p["start"], "%Y-%m")
    end = datetime.strptime(p["end"], "%Y-%m") if p["end"] else datetime(2022, 12, 1)
    duration = (end - start).days / 30.44  # months
    staffing = p["staffing"] if p["staffing"] else "DIRECT"
    print(f"  {p['id']:10s} {p['company']:20s} {p['start']:7s} -> {p['end'] or 'Present':>10s}  {duration:5.1f}mo  {p['type']:10s}  {staffing}")

# Calculate gaps
print("\n  --- Gaps between positions ---")
for i in range(1, len(sorted_pos)):
    prev_end = datetime.strptime(sorted_pos[i-1]["end"] or "2022-12", "%Y-%m") if sorted_pos[i-1]["end"] else datetime(2022, 12, 1)
    curr_start = datetime.strptime(sorted_pos[i]["start"], "%Y-%m")
    gap_months = (curr_start - prev_end).days / 30.44
    if gap_months > 0.5:
        print(f"  Gap of {gap_months:5.1f}mo between {sorted_pos[i-1]['id']} ({sorted_pos[i-1]['company']}) and {sorted_pos[i]['id']} ({sorted_pos[i]['company']})")

# 6. COMPANY TENURE
print("\n6. COMPANY TENURE")
print("-" * 40)
company_skills = defaultdict(lambda: {"positions": 0, "skills": set(), "start": None, "end": None})
for p in positions:
    cs = company_skills[p["company"]]
    cs["positions"] += 1
    cs["skills"].update(p["skills"])
    if cs["start"] is None or p["start"] < cs["start"]:
        cs["start"] = p["start"]
    end = p["end"] if p["end"] else "2022-12"
    if cs["end"] is None or end > cs["end"]:
        cs["end"] = end

for comp in sorted(company_skills, key=lambda c: company_skills[c]["start"]):
    cs = company_skills[comp]
    start = datetime.strptime(cs["start"], "%Y-%m")
    end = datetime.strptime(cs["end"], "%Y-%m")
    tenure = (end - start).days / 30.44
    print(f"  {comp:20s} {cs['positions']:2d} positions, {tenure:5.1f}mo total, skills: {', '.join(sorted(cs['skills']))}")

# 7. SKILL EVOLUTION PHASES
print("\n7. SKILL EVOLUTION PHASES")
print("-" * 40)
phases = [
    ("Phase 1: Foundation (2005-2009)", ["2005", "2006", "2007", "2008", "2009"]),
    ("Phase 2: Frontend Pivot (2009-2013)", ["2010", "2011", "2012", "2013"]),
    ("Phase 3: Enterprise JS (2013-2016)", ["2014", "2015"]),
    ("Phase 4: Modern Stack (2016-2022)", ["2016", "2017", "2018", "2019", "2020", "2021", "2022"]),
]

for phase_name, years in phases:
    print(f"\n  {phase_name}")
    phase_skills = Counter()
    phase_positions = []
    for p in positions:
        start_year = int(p["start"].split("-")[0])
        end_year = int(p["end"].split("-")[0]) if p["end"] else 2022
        for y in years:
            if int(y) in range(start_year, end_year + 1):
                phase_skills.update(p["skills"])
                phase_positions.append(p)
                break
    
    print(f"    Positions: {len(phase_positions)}")
    print(f"    Top skills: {', '.join(s for s, _ in phase_skills.most_common(10))}")
    
    # Skills that are new in this phase
    prev_skills = set()
    for prev_name, prev_years in phases:
        if prev_years[0] < years[0]:
            for p in positions:
                start_year = int(p["start"].split("-")[0])
                end_year = int(p["end"].split("-")[0]) if p["end"] else 2022
                for py in prev_years:
                    if int(py) in range(start_year, end_year + 1):
                        prev_skills.update(p["skills"])
                        break
    
    new_skills = phase_skills.keys() - prev_skills
    if new_skills:
        print(f"    New skills: {', '.join(sorted(new_skills))}")
    else:
        print(f"    New skills: (none)")

# 8. STAFFING FIRM ANALYSIS
print("\n8. STAFFING FIRM USAGE")
print("-" * 40)
staffed = [p for p in positions if p["staffing"]]
direct = [p for p in positions if not p["staffing"]]
print(f"  Direct hire:     {len(direct):2d} ({len(direct)/total*100:5.1f}%)")
print(f"  Staffing firm:   {len(staffed):2d} ({len(staffed)/total*100:5.1f}%)")

print("\n  --- By Staffing Firm ---")
firm_counts = Counter(p["staffing"] for p in staffed)
for firm, count in firm_counts.most_common():
    print(f"  {firm:20s} {count:2d} positions")

print(f"\n  --- Staffing vs Direct by Type ---")
for t in ["contract", "full_time", "freelance"]:
    t_positions = [p for p in positions if p["type"] == t]
    t_staffed = len([p for p in t_positions if p["staffing"]])
    t_direct = len(t_positions) - t_staffed
    print(f"  {t:10s}: {t_staffed:2d} staffed, {t_direct:2d} direct")

# 9. ADDITIONAL INSIGHTS
print("\n9. ADDITIONAL STATISTICS")
print("-" * 40)

# Avg skills per position
avg_skills = sum(len(p["skills"]) for p in positions) / total
print(f"  Average skills per position: {avg_skills:.1f}")
print(f"  Most skills in one position: {max(len(p['skills']) for p in positions)} ({positions[0]['id']})")
print(f"  Fewest skills in one position: {min(len(p['skills']) for p in positions)}")

# Unique companies
companies = set(p["company"] for p in positions)
print(f"  Unique companies: {len(companies)}")
print(f"  Most repeated company: amazon ({sum(1 for p in positions if p['company'] == 'amazon')} positions)")

# Avg tenure
tenures = []
for p in positions:
    start = datetime.strptime(p["start"], "%Y-%m")
    end = datetime.strptime(p["end"] or "2022-12", "%Y-%m")
    tenures.append((end - start).days / 30.44)
print(f"  Average tenure: {sum(tenures)/len(tenures):.1f} months")
print(f"  Shortest tenure: {min(tenures):.1f} months")
print(f"  Longest tenure: {max(tenures):.1f} months")

# Skills that declined over time
print(f"\n  --- Skills by era (early 2005-2010 vs late 2017-2022) ---")
early_skills = Counter()
late_skills = Counter()
for p in positions:
    sy = int(p["start"].split("-")[0])
    if sy <= 2010:
        early_skills.update(p["skills"])
    elif sy >= 2017:
        late_skills.update(p["skills"])

print(f"  Early era top: {', '.join(s for s, _ in early_skills.most_common(8))}")
print(f"  Late era top:  {', '.join(s for s, _ in late_skills.most_common(8))}")
print(f"  Skills that disappeared: {', '.join(sorted(set(early_skills.keys()) - set(late_skills.keys())))}")
print(f"  Skills that emerged:     {', '.join(sorted(set(late_skills.keys()) - set(early_skills.keys())))}")
