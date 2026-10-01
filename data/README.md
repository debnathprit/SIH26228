# Dataset Management & DVC Version Control

This directory contains versioned datasets tracked using [DVC (Data Version Control)](https://dvc.org/).

Raw image datasets are stored locally in the DVC cache and are excluded from Git commits via `.gitignore`. Git only tracks the lightweight `.dvc` pointer files that reference immutable content hashes.

---

## Intended Integrity Pipeline

```text
Dataset Upload / Ingestion
            ↓
       DVC Tracking (dvc add data/<version>)
            ↓
       Dataset Version Commit (git commit data/<version>.dvc)
            ↓
       Integrity Analysis (ml/dataset_analyzer)
            ↓
       Cryptographic Audit Report (VERIFIED / REVIEW)
```

---

## Standard DVC Workflow

### 1. Adding or Updating a Dataset Version
To add a new dataset or update an existing dataset directory:
```powershell
# 1. Place raw image files in a dedicated folder (e.g., data/v1.0 or data/sample)
# 2. Track the dataset directory with DVC
dvc add data/sample

# 3. Stage and commit the resulting DVC metadata to Git
git add data/sample.dvc data/.gitignore
git commit -m "Track dataset sample v1.0 with DVC"
```

### 2. Checking Tracking Status
```powershell
dvc status
```

### 3. Switching Between Dataset Versions
When switching Git branches or checking out older commits:
```powershell
git checkout <commit_hash_or_branch>
dvc checkout
```

### 4. Running Dataset Integrity Screening
Run the integrity analyzer on the local tracked dataset:
```python
from ml.dataset_analyzer import analyze_dataset

report = analyze_dataset("data/sample")
print(report.status)  # "VERIFIED" or "REVIEW"
print(report.to_dict())
```
