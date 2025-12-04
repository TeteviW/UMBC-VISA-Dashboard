from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Path
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import re
import numpy as np

app = FastAPI()

#Allow localhost dev and Github pages origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500", "http://localhost:5500",
        "http://127.0.0.1:8000", "http://localhost:8000",
        "https://teteviw.github.io/UMBC-VISA-Dashboard/"
    ],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

#DATA_XLSX = Path("C:/c/Users/gabri/UMBCProj/UMBC-VISA-Dashboard/DashboardBack/Case tracking for CS class.xlsx")
DATA_XLSX = Path("C:/Users/tetev/OneDrive/Documents/C++/UMBC-VISA-Dashboard/DashboardBack/Case tracking for CS class.xlsx")

SHEET = "Current H-1B cases" #Look at path to make sure its correct above

#Basic column rename (source -> UI keys)
COLUMN_MAP = {
    "First Name": "givenName",
    "Last name": "familyName",
    "Start Date": "startDate",
    "Expiration Date": "endDate",
    "Department": "department",
    "Gender": "gender",
    # "Case type" -> visaType (parsed below)
}

#Normalize visa type from "Case type" values
#For example: "H1-B initial COS from J-1", "H-1B extension", "TN petiotion", "0-1",
#             "Permanent Residency", "H-1B initial COS from F-1 OPT"
VISA_CANON = {"H-1B", "J-1", "F-1", "O-1", "TN", "PR"}
def parse_visa_type(case_type: str|float) -> str:
    if not isinstance(case_type, str):
        return "Unknown"
    s = case_type.upper()
    #Direct hits
    for k in ["H-1B", "O-1", "TN"]:
        if k in s:
            return k
    # J - 1 / F - 1 appear often as "from J-1/F-1" - if the active petition is H-1B,
    #leave as H-1B above.
    if re.search(r"\bJ-1\b", s):
        #If no H-1B match above, classify as J-1
        if "H-1B" not in s:
            return "J-1"
    if re.search(r"\bF-1\b", s):
        if "H-1B" not in s:
            return "F-1"
    #Permanent residency
    if "PERMANENT RESIDENCY" in s or "PR" in re.findall(r"\bPR\b", s):
        return "PR"
    return "Unknown"

def load_rows(limit: int | None = None):
    if not DATA_XLSX.exists():
        raise HTTPException(404, "Excel file not found") #PROBLEM!!!!
    df = pd.read_excel(DATA_XLSX, sheet_name=SHEET)
    
    #Build output with expected keys
    # 1) Rename simple columns
    df = df.rename(columns=COLUMN_MAP)

    # 2) Ensure required columns exist
    wanted = ["givenName", "familyName", "startDate", "endDate", "department", "gender"]
    for col in wanted:
        if col not in df.columns:
            df[col] = None
    
    # 3) Derive visaType from "Case type"
    df["visaType"] = df.get("Case type", None).apply(parse_visa_type)

    # 4) Clean dates -> ISO
    for c in ["startDate", "endDate"]:
        if c in df.columns:
            df[c] = pd.to_datetime(df[c], errors="coerce").dt.date.astype(str)
    
    #5 Normalize gender (file has many blanks)
    def norm_gender(x):
        if not isinstance(x, str) or not x.strip():
            return "Unknown"
        s = x.strip().upper()
        if s.startswith("M"): return "M"
        if s.startswith("F"): return "F"
        return "Unknown"
    df["gender"] = df["gender"].apply(norm_gender)

    # 6) Keep only the UI fields, drop obvious empties
    out = df[["givenName", "familyName", "visaType", "startDate", "endDate", "department", "gender"]].copy()

    out = out.replace([np.nan, np.inf, -np.inf], None)  # Add this line

    if limit:
        out = out.head(limit)

    return out.to_dict(orient="records")

@app.get("/api/records")
def api_records(limit: int = 2000):
    return {"rows": load_rows(limit)}

@app.get("/api/reports/gender")
def api_gender():
    rows = load_rows(None)
    s = pd.Series([r.get("gender") or "Unknown" for r in rows])
    counts = s.value_counts().sort_index()
    return {"labels": counts.index.tolist(), "counts": counts.values.tolist()}
