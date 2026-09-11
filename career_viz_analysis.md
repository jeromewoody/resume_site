# D3.js Visualization Analysis: Resume Career Data

## Summary Statistics
- **18 positions** spanning 2005–2022 (17 years)
- **15 unique companies** (Amazon appears 3x, Expedia 2x)
- **7 direct-hire** vs **11 via staffing firms** (61% staffed)
- **5.2 average skills** per position (range: 2–10)
- **7.8 months average tenure** (range: 1–29 months)
- **18 staffing firms** total (aim_consulting, creative_circle, lg_consulting each 2x)

---

## 1. Skill Frequency Analysis

### Data
| Skill | Count | % of Positions |
|-------|-------|----------------|
| html | 15 | 83.3% |
| css | 15 | 83.3% |
| javascript | 14 | 77.8% |
| python | 5 | 27.8% |
| php | 5 | 27.8% |
| xml | 4 | 22.2% |
| sql | 3 | 16.7% |
| java | 3 | 16.7% |
| jquery | 3 | 16.7% |
| mysql | 3 | 16.7% |
| nodejs | 2 | 11.1% |
| xpath | 2 | 11.1% |
| xslt | 2 | 11.1% |
| ruby | 2 | 11.1% |
| freemarker | 2 | 11.1% |
| perl | 2 | 11.1% |
| react | 1 | 5.6% |
| jsp | 1 | 5.6% |
| java_servlets | 1 | 5.6% |
| typescript | 1 | 5.6% |
| csharp | 1 | 5.6% |
| less | 1 | 5.6% |
| tcl | 1 | 5.6% |
| groovy | 1 | 5.6% |
| postgresql | 1 | 5.6% |
| codeigniter | 1 | 5.6% |
| xpointer | 1 | 5.6% |

### Recommended Chart: **Horizontal Bar Chart**
- **Why**: Perfect for ranking 27 skills by frequency. Horizontal layout gives each label room to read.
- **Enhancement**: Color-code by category (HTML/CSS = green, JS = blue, Backend = purple, DB = orange, XML = red).
- **Secondary view**: Grouped bar chart by category to compare HTML/CSS (31 uses), JavaScript (21), Backend (21), Databases (7), XML/Data (9).

---

## 2. Skill Co-occurrence Matrix

### Top Pairs
| Pair | Count | % |
|------|-------|---|
| css + html | 15 | 83.3% |
| html + javascript | 13 | 72.2% |
| css + javascript | 13 | 72.2% |
| html + php | 5 | 27.8% |
| css + php | 5 | 27.8% |
| html + xml | 4 | 22.2% |
| css + xml | 4 | 22.2% |
| javascript + php | 4 | 22.2% |
| javascript + python | 3 | 16.7% |
| javascript + xml | 3 | 16.7% |
| javascript + jquery | 3 | 16.7% |
| html + jquery | 3 | 16.7% |
| css + jquery | 3 | 16.7% |
| mysql + php | 3 | 16.7% |
| html + mysql | 3 | 16.7% |
| css + mysql | 3 | 16.7% |

### Recommended Chart: **D3 Chord Diagram** or **Heatmap**
- **Chord Diagram** (primary): Shows relationships between skills as ribbons connecting nodes around a circle. The thickest ribbons (css↔html, html↔javascript, css↔javascript) form a clear "frontend triangle." This reveals the natural skill ecosystem.
- **Heatmap** (alternative): 27×27 matrix with color intensity for co-occurrence count. Better for seeing the full matrix structure. Highlight the top 10 pairs.
- **Key insight**: The "frontend trio" (html+css+javascript) appears together in 13/18 positions (72%). The "PHP stack" (php+html+css+mysql) appears in 5 positions. The "XML stack" (xml+html+css) appears in 4.

---

## 3. Skills Over Time Timeline

### Year-by-Year Skill Inventory
| Year | Skills |
|------|--------|
| 2005 | css, html, java, mysql, php, xml, xpath, xpointer, xslt |
| 2006–2009 | codeigniter, css, html, javascript, mysql, perl, php, postgresql, sql, xml |
| 2010 | css, groovy, html, java, javascript, php, python, ruby, tcl |
| 2011 | css, html, javascript, python, sql |
| 2012 | css, html, javascript, php, python, sql |
| 2013 | css, freemarker, html, javascript, jquery, mysql, php |
| 2014 | css, freemarker, html, javascript, jquery, perl |
| 2015 | css, freemarker, html, java, javascript, jquery, perl |
| 2016 | csharp, css, freemarker, html, java, javascript, less, typescript |
| 2017 | csharp, css, html, javascript, less, python, sql, typescript |
| 2018 | css, html, javascript, python, ruby, xml, xpath, xslt |
| 2019 | css, html, java_servlets, javascript, jsp, nodejs, python, ruby, xml, xpath, xslt |
| 2020 | css, html, java_servlets, javascript, jsp, nodejs |
| 2022 | css, html, javascript, nodejs, python, react, xml |

### Recommended Chart: **Stacked Area Chart** or **Streamgraph**
- **Stacked Area Chart**: X-axis = years (2005–2022), Y-axis = skill count, each color = a skill. Shows the "mountain range" of skill adoption and decline.
- **Why it's useful**: Reveals the career arc — early XML/PHP dominance, mid-career JavaScript/jQuery surge, late-career React/Node.js emergence. The "disappearing" skills (perl, php, codeigniter) show visible valleys.
- **Alternative**: **Bump Chart** ranking top skills per year by position. Shows how skills trade places in importance over time.

---

## 4. Employment Type Distribution

### Data
| Type | Count | % |
|------|-------|---|
| contract | 11 | 61.1% |
| full_time | 5 | 27.8% |
| freelance | 2 | 11.1% |

### Recommended Chart: **Donut Chart** or **Pie Chart**
- **Why**: Simple, immediately understandable breakdown of 3 categories.
- **Enhancement**: Add a **stacked bar** showing contract/staffing breakdown — all 11 contracts went through staffing firms, all 5 full-time were direct hire. This reveals that contract work = staffing agency work in this career.
- **Secondary insight**: 61% contract via staffing firms suggests a deliberate career strategy of project-based work through agencies.

---

## 5. Career Timeline (Gantt Chart)

### Position Timeline
| Company | Start | End | Duration | Type | Staffing |
|---------|-------|-----|----------|------|----------|
| seattle_university | 2005-02 | 2005-08 | 5.9mo | full_time | direct |
| grist | 2006-11 | 2009-04 | 29.0mo | full_time | direct |
| all_stars_directory | 2009-08 | 2009-09 | 1.0mo | contract | lg_consulting |
| seattle_times | 2009-12 | 2010-01 | 1.0mo | contract | rylem |
| zaaz | 2010-01 | 2010-04 | 3.0mo | contract | greythorn |
| oclc | 2010-05 | 2010-10 | 5.0mo | contract | parker |
| asaalh | 2011-07 | 2012-02 | 7.1mo | freelance | direct |
| quorum_review | 2011-08 | 2012-04 | 8.0mo | contract | aim_consulting |
| zumiez | 2012-04 | 2013-01 | 9.0mo | contract | lg_consulting |
| epicenter_networks | 2013-01 | 2013-08 | 7.0mo | full_time | direct |
| expedia | 2013-11 | 2014-06 | 7.0mo | contract | aim_consulting |
| expedia | 2014-08 | 2015-05 | 9.0mo | contract | aim_consulting |
| amazon | 2015-08 | 2016-01 | 5.0mo | contract | creative_circle |
| river_logic | 2016-06 | 2017-07 | 13.0mo | full_time | direct |
| rational_interaction | 2017-09 | 2017-10 | 1.0mo | freelance | direct |
| amazon | 2018-02 | 2019-02 | 12.0mo | contract | aditi |
| amazon | 2019-07 | 2020-02 | 7.1mo | contract | creative_circle |
| discogs | 2022-01 | present | 11.0mo | full_time | direct |

### Gaps (all >2 months)
- 15.0 months: seattle_university → grist (largest gap)
- 9.0 months: oclc → asaalh
- 5.0 months: amazon(2015) → river_logic
- 4.9 months: amazon(2018) → amazon(2019)
- 4.0 months: grist → all_stars
- 23.0 months: amazon(2020) → discogs (largest gap)

### Recommended Chart: **Gantt Chart**
- **Why**: The definitive career visualization. Each bar = one position, positioned on a time axis. Bar length = tenure. Color by employment type (green=full_time, orange=contract, purple=freelance).
- **Enhancement**: Add gap markers (red dashed lines) between bars. Annotate the 4 gaps >2 months.
- **Key story**: The grist position (29 months) is the anchor. The 2009–2013 period shows rapid contract cycling (1–9 month stints). The 2016+ period shows longer, more stable engagements.

---

## 6. Company Tenure

### Data
| Company | Positions | Total Tenure | Skills |
|---------|-----------|-------------|--------|
| amazon | 3 | 54.0mo (4.5 years) | css, freemarker, html, java, java_servlets, javascript, jsp, nodejs, python, ruby, xml, xpath, xslt |
| expedia | 2 | 17.9mo (1.5 years) | css, freemarker, html, javascript, jquery, perl |
| grist | 1 | 29.0mo | codeigniter, css, html, javascript, mysql, perl, php, postgresql, sql, xml |
| river_logic | 1 | 13.0mo | csharp, css, html, javascript, less, typescript |
| discogs | 1 | 11.0mo | css, html, javascript, nodejs, python, react, xml |
| zumiez | 1 | 9.0mo | css, html, javascript, php |
| quorum_review | 1 | 8.0mo | css, html, javascript |
| oclc | 1 | 5.0mo | groovy, java, javascript, python, ruby, tcl |
| seattle_university | 1 | 5.9mo | css, html, java, mysql, php, xml, xpath, xpointer, xslt |
| epicenter_networks | 1 | 7.0mo | css, html, javascript, jquery, mysql, php |
| asaalh | 1 | 7.1mo | python, sql |
| all_stars_directory | 1 | 1.0mo | css, html, javascript |
| seattle_times | 1 | 1.0mo | css, html |
| zaaz | 1 | 3.0mo | css, html, javascript, php |
| rational_interaction | 1 | 1.0mo | python, sql |

### Recommended Chart: **Treemap** or **Horizontal Bar Chart**
- **Treemap**: Each company = a rectangle, sized by tenure. Amazon dominates (54mo/153mo total = 35%). Shows the career's concentration.
- **Why**: Treemaps handle many items well and the size encoding immediately shows Amazon as the career center of gravity.
- **Alternative**: **Horizontal bar chart** ranked by tenure. Simpler but equally effective. Label each bar with company name and tenure.

---

## 7. Skill Evolution Phases

### Phase 1: Foundation (2005–2009)
- **Positions**: 4 (seattle_university, grist, all_stars, seattle_times)
- **Top skills**: html, css, javascript, php, mysql, xml, perl, sql, postgresql, codeigniter
- **New skills**: codeigniter, css, html, java, javascript, mysql, perl, php, postgresql, sql, xml, xpath, xpointer, xslt
- **Character**: Full-stack PHP/MySQL developer with strong XML expertise. LAMP stack foundation.

### Phase 2: Frontend Pivot (2009–2013)
- **Positions**: 8 (zaaz, oclc, asaalh, quorum_review, zumiez, epicenter_networks, exp1113, exp0814)
- **Top skills**: javascript, html, css, php, jquery, python, freemarker, mysql, sql, java
- **New skills**: freemarker, groovy, jquery, python, ruby, tcl
- **Character**: Shift toward JavaScript frontend with jQuery. Python emerges. Enterprise Java (freemarker) enters.

### Phase 3: Enterprise JS (2013–2016)
- **Positions**: 3 (exp0814, amz0815, riv0616)
- **Top skills**: javascript, html, css, freemarker, jquery, java, perl
- **New skills**: (none — consolidation phase)
- **Character**: Deepening JavaScript/Java enterprise stack. TypeScript and C# appear.

### Phase 4: Modern Stack (2016–2022)
- **Positions**: 6 (riv0616, rat0917, amz0218, amz2019, dis2022)
- **Top skills**: html, css, javascript, python, nodejs, xml, react, jsp, java_servlets, xpath
- **New skills**: csharp, java_servlets, jsp, less, nodejs, react, typescript
- **Character**: Modern JS ecosystem (React, Node.js). Python for backend. XML/XPath/XSLT for data processing.

### Recommended Chart: **Small Multiples** or **Grouped Stacked Area**
- **Small Multiples**: 4 mini stacked area charts, one per phase, showing skill counts over time. Side-by-side comparison reveals the dramatic shift.
- **Why**: The phase labels are interpretive — the charts let viewers see the evidence. The most dramatic visual is the "PHP valley" (high in Phase 1, gone by Phase 4) and the "JavaScript mountain" (growing steadily across all phases).
- **Alternative**: **Sankey Diagram** showing skill flow between phases. Width of flow = skill count. Shows which skills persist, which fade, which emerge.

---

## 8. Staffing Firm Usage

### Data
- **Direct hire**: 7 positions (38.9%)
- **Staffing firm**: 11 positions (61.1%)

### By Firm
| Firm | Positions |
|------|-----------|
| aim_consulting | 3 |
| creative_circle | 2 |
| lg_consulting | 2 |
| aditi | 1 |
| parker | 1 |
| greythorn | 1 |
| rylem | 1 |

### By Type
| Type | Staffed | Direct |
|------|---------|--------|
| contract | 11 | 0 |
| full_time | 0 | 5 |
| freelance | 0 | 2 |

### Recommended Chart: **Sunburst Diagram** or **Treemap**
- **Sunburst**: Outer ring = employment type (contract/full_time/freelance). Inner ring = staffing firm. Contract (61%) is the largest slice, subdivided into 7 firms.
- **Why**: Reveals the structural insight: ALL contract work went through staffing firms, while ALL full-time and freelance were direct hire. The staffing firm breakdown shows aim_consulting as the most-used partner (3 positions).
- **Alternative**: **Stacked bar chart** with segments for each firm. Simpler but shows the same distribution.

---

## Additional Visualization Recommendations

### 9. Skill Radar Chart (Per Phase)
- **Chart**: Radar/spider chart with 4 overlays (one per phase)
- **Why**: Shows the "shape" of each career phase's skill profile. Phase 1 is a wide, deep polygon (many skills). Phase 4 is narrower but taller in JS-specific skills.
- **Data**: Aggregate skill counts per phase, normalize to 0–1 scale.

### 10. Network Graph (Skill Graph)
- **Chart**: Force-directed graph
- **Nodes**: 27 skills, sized by total usage count
- **Edges**: Co-occurrence count, weighted by thickness
- **Why**: Reveals the skill ecosystem as a graph. The "frontend cluster" (html, css, javascript, jquery, react) forms a tight triangle. The "PHP cluster" (php, mysql, codeigniter, perl) forms another. The "XML cluster" (xml, xpath, xslt, xpointer) is a smaller cluster. Node placement by force layout naturally groups these.

### 11. Career Velocity Scatter Plot
- **Chart**: Scatter plot
- **X-axis**: Position number (1–18), **Y-axis**: Tenure in months
- **Color**: By employment type, **Size**: By skill count
- **Why**: Shows career pacing over time. The first 3 positions are short (1–6mo), then grist (29mo) creates a spike. The post-2013 period shows consistent 5–13mo contracts. Reveals the shift from short gigs to longer engagements.

---

## Recommended Priority Order for Implementation

1. **Career Timeline (Gantt)** — The most impactful single visualization. Telling story.
2. **Skill Frequency (Horizontal Bar)** — Quick stats, easy to read.
3. **Skill Evolution (Stacked Area)** — Shows the career arc.
4. **Employment Type (Donut)** — Simple context.
5. **Staffing Firm (Sunburst)** — Structural insight.
6. **Skill Co-occurrence (Chord)** — Reveals skill clusters.
7. **Network Graph (Force-directed)** — Advanced, shows ecosystem.
8. **Company Tenure (Treemap)** — Shows concentration.
9. **Skill Radar (Small Multiples)** — Phase comparison.
10. **Career Velocity (Scatter)** — Pacing over time.
