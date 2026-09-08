# AI Training Datasets

Drop your dataset files in this folder. The AI agent (AgriNexus assistant + crop diagnosis) will use them to build the knowledge/RAG pipeline.

## Folder structure (create these subfolders as you upload)

```
datasets/
├── text/     ← advisories, documents, Q&A pairs (.txt, .md, .json)
├── csv/      ← tabular data (.csv) — fertilizer schedules, soil data, yields, prices
└── images/   ← crop/disease photos (label them, e.g. tomato-late-blight-1.jpg)
```

## How to upload from github.com

1. Open this `datasets/` folder in your repo on github.com
2. Click **Add file → Upload files**
3. Drag your files in, then click **Commit changes**

## Limits & tips

- Keep each file **under 100 MB** (GitHub hard limit); under 50 MB avoids warnings
- A few hundred rows/images per type is plenty to start
- CSV: include a header row with clear column names
- Images: filename should say the crop + disease, e.g. `paddy-blast-3.jpg`
- Text: one topic per file works best

Once uploaded, tell the assistant and it will pull the files, inspect formats, and wire them into the RAG pipeline (Supabase pgvector + Gemini embeddings).
