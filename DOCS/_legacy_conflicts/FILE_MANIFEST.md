> ⚠️ **ARCHIVED / CONFLICTING DOCUMENT**
> This file is retained for historical reference only.
> It does NOT reflect the current implementation or plan and must not be used as a development source of truth.

---

# File System Manifest - dogtrainersdirectory.com.au Project
**Last Updated:** November 28, 2025  
**Cleanup Date:** November 28, 2025  
**Status:** ✅ Final Authoritative Version

---

## 📋 Executive Summary

This manifest documents the final file structure for the dogtrainersdirectory.com.au modernization project after consolidation and cleanup. All obsolete, duplicate, and intermediate files have been removed, leaving only the authoritative final versions.

**Final File Count:** 10 files (9 project files + 1 original source PDF)  
**Files Deleted:** 20 files (obsolete versions, analysis documents, PDFs, temporary files)

> **Phase 2 update (February 2026):** The application source now lives under `/Users/carlg/Documents/PROJECTS/Project-dev/DTD`. The canonical docs listed below remain unchanged, but new execution reports are stored alongside them. The most recent addition is `DOCS/PHASE_2_FINAL_COMPLETION_REPORT.md`, which captures the triage/filtering milestone; treat it as read-only evidence that Phase 2 is approved.
>
> **Phase 5 update (February 2026):** Emergency ops + admin automation are complete. `DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md` and updated README/plan/checklist files live alongside the other phase reports in `/Users/carlg/Documents/PROJECTS/Project-dev/DTD/DOCS`.

---

## 🔒 Canonical (SSOT)

The following files are the canonical Single Source Of Truth (SSOT) for this project — changes to these files must follow the governance described in `DOCS/PLAN_REVIEW.md` and should be coordinated with maintainers / CI checks:

- `DOCS/blueprint_ssot_v1.1.md` — product & systems SSOT (architecture, UX rules, taxonomies)
- `DOCS/FILE_MANIFEST.md` — this manifest (SSOT for file map & doc status)
- `DOCS/PLAN_REVIEW.md` — project plan + phase-state (SSOT for roadmap & approvals)
- `DOCS/PHASE_1_FINAL_COMPLETION_REPORT.md` … `DOCS/PHASE_5_FINAL_COMPLETION_REPORT.md` — phase evidence (SSOT audit trail)
- `DOCS/automation/automation-checklist.md` — ops & automation runbook (SSOT)
- `DOCS/automation/automation_secrets.md` — secrets handling guidance (SSOT policy)
- `DOCS/automation/REMOTE_DB_MIGRATIONS.md` — remote DB migration runbook (SSOT)
- `DOCS/automation/ABN-ABR-GUID_automation/` — ABN/ABR rollout & allowlists (SSOT)
- `DOCS/ai/ai_agent_execution_v2_corrected.md` — AI agent playbook (SSOT)
- `DOCS/ai/ai_automation_assessment.md` — AI automation assessment (SSOT)
- `DOCS/db/MIGRATIONS_INDEX.md` — canonical migrations index (SSOT)
- `supabase/schema.sql` — canonical schema snapshot (referenced by MIGRATIONS_INDEX.md)

## 📁 Final File Structure

```
/home/ubuntu/
├── FILE_MANIFEST.md                          (This file - audit trail & quick reference)
├── blueprint_ssot_v1.1.md                    (THE authoritative blueprint - 45K)
├── suburbs_councils_mapping.csv              (THE authoritative suburb data - 18K)
├── DOCS/
│   ├── README.md                             (Docs entrypoint — top-level index)
│   ├── FILE_MANIFEST.md                      (Doc manifest / SSOT)
│   ├── PLAN_REVIEW.md                        (Project plan + approvals)
│   ├── PHASE_1_FINAL_COMPLETION_REPORT.md
│   ├── PHASE_2_FINAL_COMPLETION_REPORT.md
│   ├── PHASE_3_FINAL_COMPLETION_REPORT.md
│   ├── PHASE_4_FINAL_COMPLETION_REPORT.md
│   ├── PHASE_5_FINAL_COMPLETION_REPORT.md
│   ├── automation/                           (Ops & runbooks — SSOT for ops)
│   │   ├── automation-checklist.md
│   │   ├── automation_secrets.md
│   │   ├── REMOTE_DB_MIGRATIONS.md
│   │   └── ABN-ABR-GUID_automation/
│   ├── ai/                                   (AI playbooks + assessments)
│   │   ├── ai_agent_execution_v2_corrected.md
│   │   └── ai_automation_assessment.md
│   └── db/
│       └── MIGRATIONS_INDEX.md               (Canonical migrations index)
├── implementation/
│   ├── abn_validation_implementation.md
│   ├── ai_automation_assessment.md
│   └── master_plan.md
└── Uploads/
    └── Suburbs-councils-catchment.pdf        (Original source PDF - 38K) ⚠️ NEVER DELETE
```

---

## ✅ Files Kept (Final/Authoritative)

### Root Level Files

#### 1. **blueprint_ssot_v1.1.md** (45K)
- **Status:** 🔒 AUTHORITATIVE - Single Source of Truth
- **Version:** 1.1 (Updated with 28 councils)
- **Description:** Complete blueprint for platform modernization
- **Contents:**
  - Current state analysis (WordPress + WooCommerce)
  - Modern stack recommendations (Next.js 14 + Supabase)
  - 28 council catchment areas (corrected from original 31)
  - Security, performance, and SEO architecture
  - Implementation phases and technical specifications
- **Why Kept:** Latest version with corrected council data; supersedes v1.0
- **Replaces:** `blueprint_ssot_v1_complete.md` (v1.0 in Uploads - deleted)

#### 2. **suburbs_councils_mapping.csv** (18K)
- **Status:** 🔒 AUTHORITATIVE - Enriched Dataset
- **Description:** Complete suburb-to-council mapping with geographic data
- **Contents:**
  - 540 unique suburbs (deduplicated)
  - 28 councils (corrected)
  - Postcodes for each suburb
  - Latitude/longitude coordinates
  - State information
- **Enrichment:** Added postcodes and geo-coordinates via OpenCage API
- **Why Kept:** Enriched version with complete geographic data
- **Replaces:** `suburbs_councils_mapping.csv` (non-enriched - deleted)

### Implementation Folder

#### 3. **implementation/abn_validation_implementation.md** (27K)
- **Description:** Technical guide for ABN validation integration
- **Contents:**
  - ABN Registry API integration
  - Real-time validation logic
  - Error handling strategies
  - UI/UX considerations
  - Testing procedures
- **Why Kept:** Critical for business verification feature

#### 4. **implementation/ai_automation_assessment.md** (33K)
- **Description:** AI/automation feasibility analysis
- **Contents:**
  - AI-powered review moderation
  - Automated SEO optimization
  - Chatbot customer support
  - Implementation complexity ratings
  - ROI analysis
- **Why Kept:** Strategic decision-making document for Phase 3+

#### 5. **implementation/master_plan.md** (26K)
- **Description:** Consolidated implementation roadmap
- **Contents:**
  - Phase-by-phase execution plan
  - Resource requirements
  - Timeline estimates
  - Risk mitigation strategies
  - Success metrics
- **Why Kept:** Primary project management reference
- **Consolidates:** Data enrichment plan + duplicate resolution docs

#### 6. **PHASE_2_FINAL_COMPLETION_REPORT.md**
- **Description:** Evidence pack confirming the Phase 2 triage + filtering deliverable
- **Contents:**
  - Summary of UI/API work
  - Success criteria checklist mapped to code locations
  - Manual QA notes (Fitzroy↔Brighton distance, verified-only, price slider, etc.)
  - Residual risks + next-phase readiness statement
- **Why Kept:** Serves as the audit artifact proving Phase 2 is complete and locking the triage/filtering behavior going into Phase 3.

#### 7. **PHASE_3_FINAL_COMPLETION_REPORT.md**
- **Description:** Evidence pack for Phase 3 (directory, profiles, autocomplete)
- **Contents:** Summary of new UI/API work, success-criteria verification, QA notes, lint caveat, Phase 4 readiness
- **Why Kept:** Locks the Phase 3 deliverable; reference this before onboarding (Phase 4) tasks.

#### 8. **PHASE_4_FINAL_COMPLETION_REPORT.md**
- **Description:** Evidence pack confirming Phase 4 manual onboarding + ABN verification
- **Contents:** Multi-step onboarding UI summary, `/api/onboarding` ABR integration, success-criteria mapping, QA notes, residual risks
- **Why Kept:** Serves as the audit artifact proving Phase 4 is complete before monetization/automation work begins.

#### 9. **PHASE_5_FINAL_COMPLETION_REPORT.md**
- **Description:** Evidence pack confirming Phase 5 emergency triage, AI logging, admin digest, and review moderation automation.
- **Contents:** Summary of `/emergency` UI, emergency schema + RPC changes, verification job endpoints, admin dashboard upgrades, lint/test status, residual risks.
- **Why Kept:** Locks Phase 5 deliverables and serves as proof before moving to monetization/web-scraper work.

### Original Source

#### 10. **Uploads/Suburbs-councils-catchment.pdf** (38K)
- **Status:** 🔒 ORIGINAL SOURCE - NEVER DELETE
- **Description:** Original catchment area data from client
- **Why Kept:** Authoritative source document; reference for verification
- **Protection:** This file is the ground truth and must always be preserved

---

## 🗑️ Files Deleted (Audit Trail)

### Obsolete Versions

| File | Size | Reason Deleted |
|------|------|----------------|
| `Uploads/blueprint_ssot_v1_complete.md` | 44K | **v1.0 obsolete** - Superseded by v1.1 with corrected 28 councils (was 31) |
| `blueprint_ssot_v1.1_updated.md` | 45K | **Duplicate** - Renamed to `blueprint_ssot_v1.1.md` (cleaner naming) |
| `suburbs_councils_mapping_enriched.csv` | 18K | **Duplicate** - Renamed to `suburbs_councils_mapping.csv` (cleaner naming) |

### Analysis & Review Documents

| File | Size | Reason Deleted |
|------|------|----------------|
| `suburbs_councils_analysis.md` | 20K | **Analysis complete** - Findings incorporated into v1.1 blueprint |
| `blueprint_review_comprehensive.md` | 17K | **Initial review** - Insights integrated into v1.1 |
| `EXTRACTION_SUMMARY.md` | 7.8K | **Temporary analysis** - Data extracted and validated |
| `DELIVERABLES_SUMMARY.md` | 15K | **Temporary summary** - Consolidated into final docs |

### Intermediate Resolution Documents

| File | Size | Reason Deleted |
|------|------|----------------|
| `duplicate_suburb_resolution.md` | 12K | **Consolidated** - Merged into `implementation/master_plan.md` |
| `data_enrichment_plan.md` | 14K | **Consolidated** - Merged into `implementation/master_plan.md` |

### Completed Task Files

| File | Size | Reason Deleted |
|------|------|----------------|
| `data_enrichment_script.py` | 5.5K | **Task complete** - Enrichment finished; script no longer needed |
| `enrichment_log.txt` | 12K | **Task complete** - Enrichment successful; log archived |
| `suburb_stats.json` | 1.1K | **Task complete** - Stats incorporated into analysis |

### Duplicate Files (Original Locations)

| File | Size | Reason Deleted |
|------|------|----------------|
| `abn_validation_implementation.md` | 27K | **Moved** - Now in `implementation/` folder |
| `ai_automation_assessment.md` | 33K | **Moved** - Now in `implementation/` folder |
| `implementation_plan_master.md` | 26K | **Moved** - Renamed to `implementation/master_plan.md` |

### PDF Exports (All Deleted)

| File | Size | Reason Deleted |
|------|------|----------------|
| `blueprint_ssot_v1.1_updated.pdf` | 101K | **Export** - Can be regenerated from .md if needed |
| `abn_validation_implementation.pdf` | 123K | **Export** - Can be regenerated from .md if needed |
| `ai_automation_assessment.pdf` | 123K | **Export** - Can be regenerated from .md if needed |
| `implementation_plan_master.pdf` | 90K | **Export** - Can be regenerated from .md if needed |
| `blueprint_review_comprehensive.pdf` | 64K | **Export** - Source .md deleted |
| `duplicate_suburb_resolution.pdf` | 59K | **Export** - Source .md deleted |
| `data_enrichment_plan.pdf` | 77K | **Export** - Source .md deleted |
| `EXTRACTION_SUMMARY.pdf` | 92K | **Export** - Source .md deleted |
| `DELIVERABLES_SUMMARY.pdf` | 115K | **Export** - Source .md deleted |

**Total Deleted:** 20 files (~850K freed)

---

## 📖 Quick Reference Guide

### Where to Find What

| What You Need | File Location |
|---------------|---------------|
| **Platform architecture & tech stack** | `blueprint_ssot_v1.1.md` § Technical Architecture |
| **28 council catchment areas** | `blueprint_ssot_v1.1.md` § Catchment Areas |
| **Security & authentication design** | `blueprint_ssot_v1.1.md` § Security Considerations |
| **SEO strategy** | `blueprint_ssot_v1.1.md` § SEO & Performance |
| **Suburb-to-council mapping data** | `suburbs_councils_mapping.csv` |
| **Geographic coordinates (lat/long)** | `suburbs_councils_mapping.csv` (columns: latitude, longitude) |
| **Postcode data** | `suburbs_councils_mapping.csv` (column: postcode) |
| **ABN validation technical guide** | `implementation/abn_validation_implementation.md` |
| **Example allowlist (archived)** | `scripts/examples/controlled_abn_list.example.json` (generated allowlists are git-ignored) |
| **AI/automation feasibility** | `implementation/ai_automation_assessment.md` |
| **Implementation roadmap** | `implementation/master_plan.md` |
| **Phase-by-phase execution plan** | `implementation/master_plan.md` § Implementation Phases |
| **Resource requirements** | `implementation/master_plan.md` § Resource Planning |
| **Original source data** | `Uploads/Suburbs-councils-catchment.pdf` |

### Key Data Points

- **Total Suburbs:** 540 (deduplicated from 598 raw entries)
- **Total Councils:** 28 (corrected from original 31)
- **Geographic Coverage:** NSW, VIC, QLD, ACT, SA
- **Data Quality:** 100% enriched with postcodes and coordinates
- **Blueprint Version:** 1.1 (authoritative)

---

## 🔄 File Naming Conventions

### Adopted Standards
- **Blueprint:** `blueprint_ssot_v{major}.{minor}.md`
- **Data Files:** Descriptive name without version suffix (e.g., `suburbs_councils_mapping.csv`)
- **Implementation Docs:** Descriptive purpose-based naming (e.g., `master_plan.md`, not `implementation_plan_master.md`)

### Rationale
- Cleaner, more professional naming
- Easier to reference in documentation
- Less redundancy (no "updated" or "enriched" suffixes)
- Version info embedded in blueprint filename only

---

## 🛡️ File Protection Rules

### NEVER DELETE
1. **`Uploads/Suburbs-councils-catchment.pdf`** - Original source data from client
2. **`blueprint_ssot_v1.1.md`** - Authoritative blueprint (unless superseded by v1.2+)
3. **`suburbs_councils_mapping.csv`** - Enriched master data (unless re-enriched)

### Before Deleting Any File
1. Confirm it's not listed in "Files Kept" section above
2. Verify data is preserved elsewhere
3. Check if it's marked as authoritative (🔒)
4. Document deletion in this manifest

---

## 📊 Data Integrity Verification

### Suburbs CSV Checksums
- **Rows:** 540 suburbs (header + 540 data rows = 541 total)
- **Columns:** suburb, council, postcode, state, latitude, longitude
- **Enrichment Status:** 100% complete (all postcodes and coordinates populated)
- **Duplicate Status:** Fully deduplicated

### Blueprint Version History
- **v1.0:** 31 councils (obsolete - deleted from Uploads/)
- **v1.1:** 28 councils (current authoritative version) ✅

### Council List (28 Total)
Blacktown, Blue Mountains, Brimbank, Campbelltown (NSW), Campbelltown (SA), Canterbury-Bankstown, Cumberland, Fairfield, Greater Dandenong, Hawkesbury, Hills Shire, Hornsby, Knox, Liverpool, Maroondah, Melton, Monash, Moreland, Parramatta, Penrith, Redland, Ryde, Sutherland Shire, The Hills Shire, Whitehorse, Whittlesea, Wyndham, Yarra Ranges

---

## 🚀 Next Steps for Users

### For Developers
1. Start with `blueprint_ssot_v1.1.md` for architecture overview
2. Reference `implementation/master_plan.md` for execution phases
3. Use `suburbs_councils_mapping.csv` for database seeding

### For Project Managers
1. Review `implementation/master_plan.md` for timeline and resources
2. Check `implementation/ai_automation_assessment.md` for Phase 3+ planning
3. Use this manifest to understand project deliverables

### For Stakeholders
1. Read `blueprint_ssot_v1.1.md` § Executive Summary for high-level vision
2. Review catchment area corrections (28 councils vs original 31)
3. Verify suburbs in your area using `suburbs_councils_mapping.csv`

---

## 📝 Change Log

| Date | Action | Details |
|------|--------|---------|
| 2025-11-28 | Initial extraction | Extracted 598 suburb entries from PDF |
| 2025-11-28 | Analysis complete | Identified 28 councils (corrected from 31) |
| 2025-11-28 | Data enrichment | Added postcodes and coordinates to 540 suburbs |
| 2025-11-28 | Blueprint v1.1 | Updated blueprint with corrected council data |
| 2025-11-28 | File system cleanup | Deleted 20 obsolete files; organized final structure |
| 2025-11-28 | Manifest created | Created this audit trail document |

---

## ⚠️ Important Notes

1. **Blueprint v1.0 vs v1.1:** The original PDF listed 31 councils, but analysis revealed only 28 unique councils. v1.1 corrects this.

2. **Suburb Deduplication:** 598 raw entries → 540 unique suburbs after removing duplicates (same suburb appearing under multiple councils).

3. **Geographic Enrichment:** All 540 suburbs now have postcodes, latitude, longitude, and state data via OpenCage Geocoding API.

4. **PDF Export Policy:** All PDFs were deleted as they can be regenerated from markdown source. If needed, use Pandoc or similar tools.

5. **Version Control Recommendation:** Consider moving these files to a Git repository for proper version control going forward.

---

## 📞 Support & Maintenance

### If You Need To...

**Regenerate PDF exports:**
```bash
pandoc blueprint_ssot_v1.1.md -o blueprint_ssot_v1.1.pdf
pandoc implementation/master_plan.md -o master_plan.pdf
```

**Verify CSV data integrity:**
```bash
wc -l suburbs_councils_mapping.csv  # Should show 541 (header + 540 rows)
cut -d',' -f2 suburbs_councils_mapping.csv | sort -u | wc -l  # Should show 29 (header + 28 councils)
```

**Search for a specific suburb:**
```bash
grep -i "suburb_name" suburbs_councils_mapping.csv
```

**Find all suburbs in a council:**
```bash
grep -i "council_name" suburbs_councils_mapping.csv
```

---

## ✅ Cleanup Verification Checklist

- [x] Blueprint v1.1 present in root
- [x] Enriched CSV present in root
- [x] Implementation folder created with 3 files
- [x] Original PDF preserved in Uploads/
- [x] All obsolete files deleted (20 files)
- [x] All duplicate files removed
- [x] All PDF exports removed
- [x] File naming conventions standardized
- [x] Manifest created and documented

**Cleanup Status:** ✅ Complete

---

*End of File Manifest*
