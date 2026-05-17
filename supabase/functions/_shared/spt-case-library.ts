// Shared SPT case library + citation rules.
// Used by spt-chat (consultant chat) and analyze-well-stage (pipeline verdicts).
// Update both consumers when adding new cases or document paths.

export const SPT_CASE_LIBRARY = `## SPT Reference Programs — Real Case Library (use as few-shot examples)
Curated library of real SPT/HSP programs executed by Maxxwell Production (A. Nikouline, CEO).
When designing/evaluating an SPT program, cite the closest analogue by ID and adapt its numbers.

### Case 1 — JTM 1093W S202 (TREATED, Chevron Wolverine, McElroy TX, Grayburg)
TD 3150 ft · 5.5"/4.95" csg · 2.88" tbg · pay 2766–2951 ft · BHP 800 psi · fluid 5.7 ppg · packer 2600 ft
Treatment: pressure 5000 psi · slurry 5.54 bbl/min · sand 0.25 ppg · N₂ 15% · speed 4.5 mm/min
Cuts: 2775–80, 2787–92, 2865–75, 2890–2900 ft · net slots 12.5 ft / gross 74.5 ft
Drainage 226 ft² · rock 0.58 t · losses 904 psi · ΔP nozzles 4393 psi
Pre-treatment GIS (Silagina, Nov 2015): pay zones Fm E 2761–2820 ft + D5 2826–2910 ft.
**Sources:** /training-data/spt/JTM1093W_S202_Wolverine_Maxxwellv2.xlsm (program); /training-data/spt/JTM1093W_Fig1_GIS.pdf (GIS); /training-data/spt/JTM1093W_Fig2_Correlation.pdf (correlation); /training-data/spt/JTM1093W_Silagina_GIS_Report_2015.docx (Silagina interpretation).

### Case 2 — JTM 1606W (CANDIDATE, Chevron Wolverine, McElroy TX, Grayburg Pay A1)
Injector, drilled 2011. TD 2763 ft · 5.5"/4.95" csg · 2.88" tbg · packer 2557 ft · open hole 2671–2763 ft
Existing perfs 2716–2755 ft. GIS thermogram: fluid entry from 2725 ft, low intensity.
Recommended SPT (Silagina): 2716–2730 ft (clean sand 2719–2729 ft, low GR). Net slots 14 ft.
**Sources:** /training-data/spt/JTM1606W_Fig1_GIS.pdf (GIS thermogram); /training-data/spt/JTM1606W_Silagina_GIS_Report_2015.docx (recommendation).

### Case 3 — FCL Workman Hz 3B13-20/4B10-19-1-31W1M (CANDIDATE, SK, Sherwood Porosity / Mississippian)
Horizontal, lateral 325 m. TD 5413 ft MD / TVD 3898 ft · 9.625"/9" csg · fluid 8.96 ppg
Lateral reservoir quality: Fair 105 m + Poor-Fair 110 m + Poor 75 m.

### Case 4 — Barracuda Pinto 03-04-002-03W2 (CANDIDATE, SK, Midale/Frobisher)
TD 5200 ft · 4.5"/4.09" csg · 2.88" tbg · packer 4948 ft · fluid 9.43 ppg gel
Pressure 6019 psi · slurry 12.2 bbl/min · sand 0.25 ppg · 41 stages
Net slots 2.95 ft / gross 45 ft · drainage 138 ft² · rock 0.33 t · losses 850 psi
Abrasive: 22 t (2 nozzles) / 44 t (4 nozzles).

### Case 5 — Admiralty Pinto 02-01-002-05W2 (CANDIDATE, SK, Midale/Frobisher)
TD 5417 ft · 4.5"/4.09" csg · 2.88" tbg · packer 5204 ft · BHT 60°C · fluid 9.43 ppg
Treatment 5204–5241 ft. Pressure 6019 psi · slurry 12.2 bbl/min
Net slots 38.7 ft / gross 121 ft · drainage 365 ft² · rock 0.89 t · ΔP nozzles 4300 psi
Abrasive: 27 t / 54 t. Working time ~30 hours.

### Case 6 — SE Matthews #10 (CANDIDATE, Chevron MCBU pilot, TX)
TD 6500 ft · 5.5"/4.95" csg · 2.88" tbg · pay ~6400–6500 ft (Schlumberger AIT-H + DPHI/NPHI)
One of 5 Chevron pilot wells, program window 10/1/2015 – 3/31/2016.
**Sources:** /training-data/spt/SE_Matthews_10_Log_with_Header.pdf (Schlumberger log); /training-data/spt/SE_Matthews_10_WBDs.xlsx (wellbore diagrams); /training-data/spt/CUSA_Maxxwell_Service_Order_DRAFT_2015.docx (MSA); /training-data/spt/Chevron_Vendor_Taxability_Notice.pdf (onboarding).

### Case 7 — REDMAN D #1 / API 142090023639 (TREATED, ReduxEnergy, Montague TX, Granite Wash)
Vertical, TD 2959 ft · 5.5"/4.95" csg · 2.88" tbg · existing perfs 2670–2685 ft · fluid 8.34 ppg
Program TX-001 (Jan 29, 2014): 12 cuts at 2651.5–2653.14 + 2674.5–2676.14 ft
Pressure 6019 psi · slurry 5.5 bbl/min · sand 0.25 ppg · speed 4.5 mm/min · lift 3 ft
Net slots 3.28 ft / gross 25 ft · drainage 95 ft² · rock 0.23 t · ΔP nozzles 4200 psi
Abrasive: 20 t / 40 t. History: cum 33,470 BBL oil / 100,636 BBL water since 1984.
**Sources:** /training-data/spt/REDMAN_D_1_API142090023639_Cut_Program.pdf (full TX-001 program).

### Equipment & technology references (generic, applicable to any case)
/training-data/spt/equipment/Perforator-3-nozzles.pdf, /training-data/spt/equipment/Perforator-4-nozzles.pdf (perforator geometry & ΔP);
/training-data/spt/equipment/Centralizer-1.pdf, /training-data/spt/equipment/Centralizer-2.pdf (centralizers);
/training-data/spt/equipment/Support-A.pdf, /training-data/spt/equipment/Support-B.pdf (downhole supports);
/training-data/spt/equipment/Cutting-Speed-4-mm-per-min.jpg (cutting speed);
/training-data/spt/equipment/Temperature-Pressure-Cutting.jpg (T/P envelope);
/training-data/spt/equipment/Surface.jpg (surface layout);
/training-data/spt/equipment/process-1.jpg (process overview);
/training-data/spt/equipment/etd-01242003-103649-1.pdf (methodology / patent background).

### How to apply
1. Match user's well to closest case by depth range, casing OD, formation (carbonate/sandstone), geometry, perf interval.
2. Use matched case's pressure, slurry rate, sand concentration, speed, ΔP nozzles as starting point; adjust ±10–20% for depth/lithology.
3. Shallow <3000 ft → Case 1 or 7 (5–5.5 bbl/min, 5000–6000 psi).
4. Deep >5000 ft carbonate → Case 4 or 5 (12.2 bbl/min, 6019 psi, gel fluid 9.43 ppg).
5. Horizontals → Case 3 (reservoir-quality segmentation along lateral).
6. Always state: **"Analogue: Case N (well-id) — adapted for your TD/formation."**`;

export const CITATION_RULES = `## CITATIONS — MANDATORY OUTPUT FORMAT
Whenever you state an SPT parameter (pressure, slurry rate, cut intervals, sand tonnage, ΔP, drainage area, net/gross slots), an analogue reference, a formation interpretation, or any number sourced from the case library above, you MUST cite the source document inline as a markdown link.

**Format:** \`[filename.ext](/training-data/spt/path/filename.ext "what was taken")\`
- Use ONLY paths that appear in the "Sources:" lines or "Equipment & technology references" above. Never invent file paths.
- Place the citation immediately after the fact. Example: *Slurry rate 5.54 bbl/min ([JTM1093W_S202_Wolverine_Maxxwellv2.xlsm](/training-data/spt/JTM1093W_S202_Wolverine_Maxxwellv2.xlsm "treatment program parameters")).*
- At the end of every answer that used the library, add a **## Sources** section listing each unique cited document with a one-line note.
- If a claim has no document backing, suffix it with **(general SPT knowledge)** so the user knows it is not document-sourced.`;
