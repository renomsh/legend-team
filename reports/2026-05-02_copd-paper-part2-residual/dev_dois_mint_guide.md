# DOI Mint Guide — KOCOSS Education-Mediation Replication Bundle

**For:** Master / 1저자 (Kwon Eunjin)
**Bundle location:** `C:/Projects/COPD/Data/ver2.0/submission_session174_2026-05-02/zenodo_upload_bundle/`
**Total bundle size:** ~700 KB (data 328 KB + scripts 124 KB + outputs 249 KB)

DOI minting requires Zenodo or OSF account login. Dev cannot execute. The steps below are exactly what 1저자 should follow.

---

## Recommended platform: Zenodo (CERN)

- DOI is permanent and globally citable
- Free for academic use, no file-size cap up to 50 GB per record
- Native ORCID linkage
- ERJ accepts Zenodo DOIs in Methods §Code/data availability without question

OSF is acceptable as a secondary option but uses a different DOI prefix (10.17605 vs 10.5281).

---

## Pre-mint checklist (before opening Zenodo)

1. Confirm `zenodo_upload_bundle/data/canonical_cohort_deid.csv` is the **deidentified** copy (28 columns, `subj_hash` instead of SUBJ_ID, `baseline_year` instead of BASELINE_DATE, `hosp_anon` instead of hosp). Open in Excel and visually inspect the first 5 rows. **Do not upload the raw `canonical_cohort.csv`.**
2. Confirm IRB approval text for public release of de-identified KOCOSS data is in hand. If KOCOSS data sharing policy requires per-release notification, send the notification before publishing the DOI.
3. Decide on licence: README currently states MIT (code) + CC BY 4.0 (data). If KOCOSS investigators require a more restrictive licence (e.g. CC BY-NC), edit `zenodo_upload_bundle/README.md` accordingly **before** zipping.
4. Zip the bundle:
   ```bash
   cd C:/Projects/COPD/Data/ver2.0/submission_session174_2026-05-02
   # Windows PowerShell:
   Compress-Archive -Path zenodo_upload_bundle\* -DestinationPath KOCOSS_education_mediation_replication.zip
   ```

---

## Zenodo mint — step by step

1. Go to https://zenodo.org/. Sign in with **ORCID** (recommended — auto-fills author metadata) or institutional email.
2. Top-right "Upload" -> "New upload".
3. Drag `KOCOSS_education_mediation_replication.zip` into the file area. Wait for upload to finish (sub-1 MB, < 5 sec).
4. Fill metadata:
   - **Resource type:** Dataset (this triggers a `10.5281/zenodo.*` DOI prefix that ERJ recognises as a data DOI). If you prefer "Software", that also yields a Zenodo DOI but tags it as software — choose Dataset for KOCOSS analytic-data primacy.
   - **Title:** "KOCOSS Education-Mediation Replication Bundle (n=2,712, ERJ submission 2026)"
   - **Authors:** All manuscript authors in the same order. Add ORCID where available.
   - **Description:** Paste the first three paragraphs of `README.md` (the "Companion code and de-identified analysis dataset for ..." block plus "## Contents" overview).
   - **Keywords:** COPD; PRISm; causal mediation; SGRQ; KOCOSS; education; health inequalities
   - **Licence (data):** Creative Commons Attribution 4.0 International (or your IRB-approved alternative)
   - **Licence (software):** MIT — add this in the "Additional related identifiers" or in the description, since Zenodo single-licence per record.
   - **Funding:** Add KOCOSS funder (NRF Korea, KDCA, or whichever applies).
   - **Related identifiers:** Add the manuscript DOI as "is supplement to" once the manuscript is published. For pre-publication mint, leave blank and add later via Zenodo's edit-metadata flow (DOI stays the same).
   - **Communities:** Optional — search for "respiratory" or "epidemiology" if relevant.
   - **Version:** 1.0.0
5. Click **Save** (draft state, no DOI yet).
6. Review everything, then click **Publish**. **This step is irreversible** — once published, files cannot be removed (only superseded by a new version). Zenodo issues a permanent DOI within seconds.
7. Copy the DOI from the published record page. It will look like `10.5281/zenodo.NNNNNNN`.

---

## Manuscript update after DOI is minted

**Insert the DOI string** in three locations:

### 1. `reports/2026-05-02_copd-paper-part2-residual/full_manuscript_ver3.5_F_E.md`

Methods §Statistical analysis -> "Code and data availability" subsection. Currently reads:

> Analytic code and the de-identified analysis dataset are deposited at [DOI placeholder, to be minted at acceptance];

Replace `[DOI placeholder, to be minted at acceptance]` with `https://doi.org/10.5281/zenodo.NNNNNNN` (or `Zenodo, doi:10.5281/zenodo.NNNNNNN`).

This text is at approximately **line 106** (Methods section, "Code and data availability" paragraph). Search the file for the literal string `[DOI placeholder` to locate it precisely.

### 2. Cover letter (`cover_letter_ver3.5_F.md` if present)

If the cover letter mentions code/data availability, paste the same DOI there. Search the file for `DOI placeholder` or `Zenodo` to find the right spot.

### 3. Manuscript frontmatter

Add a `code_data_doi:` field to the YAML frontmatter at the top of `full_manuscript_ver3.5_F_E.md`:

```yaml
code_data_doi: "10.5281/zenodo.NNNNNNN"
```

And add a one-line entry to the `changelog:` field:

```
ver3.5_F -> ver3.5_F_doi: code/data DOI minted at Zenodo (10.5281/zenodo.NNNNNNN); README, manuscript Methods, cover letter updated.
```

---

## Post-acceptance update flow

Once the manuscript is accepted, you can:

1. Edit the Zenodo record metadata to add the published manuscript's DOI as a "Related identifier" -> "is supplement to". The Zenodo DOI itself stays the same.
2. If sensitivity analyses are added during peer review (e.g. additional Table 4 rows), upload a v1.1.0 of the bundle. Zenodo issues a fresh DOI that links back to v1.0.0; ERJ-final manuscript should cite the **concept DOI** (the version-agnostic top-level DOI, e.g. `10.5281/zenodo.NNNNNNN-1`) so future versions remain reachable.

---

## OSF alternative (only if Zenodo is unavailable)

1. https://osf.io/ -> Sign up / log in
2. Create new "Project" -> Upload `KOCOSS_education_mediation_replication.zip`
3. Project Settings -> Mint DOI (button under "Identifiers")
4. DOI prefix will be `10.17605/OSF.IO/XXXXX`
5. Update manuscript text the same way as the Zenodo flow above, substituting the OSF DOI string.

---

## Dev-side verification done

- [x] Bundle assembled at `zenodo_upload_bundle/` (3 subdirs: `data/`, `scripts/`, `outputs/`)
- [x] `canonical_cohort_deid.csv` produced (n=2,712, 28 cols, PII removed: SUBJ_ID->sha256[:16], BASELINE_DATE->year, hosp->H01..H46)
- [x] All 15 analysis scripts copied (`00_*` to `08_*`, `S1_*`, `S2_S6_S7_regen`, `S3_*`, `S4_*`, `S8_*`, `deidentify_for_zenodo`)
- [x] All supplementary outputs copied (S1 fig, S3/S4/S8 json+md, table4_S2_S6_S7_regen, cohort_flow, evalue, followup_sweep)
- [x] `README.md` written with citation block + reproduction guide + licence

## Dev-side NOT done (Master / 1저자 action required)

- [ ] Zip the bundle (PowerShell command in pre-mint checklist)
- [ ] IRB / KOCOSS sharing policy confirmation
- [ ] Final author list, ORCID IDs, funder metadata
- [ ] Zenodo account creation / login
- [ ] Click "Publish" in Zenodo UI
- [ ] Paste minted DOI into manuscript (3 locations above) + cover letter
- [ ] Commit updated manuscript with DOI to legend-team repo
