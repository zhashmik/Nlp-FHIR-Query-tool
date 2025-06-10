# AI on FHIR: Backend (Python with real FHIR API and pagination)
from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import re
import json
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app) 


nlp = spacy.load("en_core_web_sm")


diagnosis_keywords = ["diabetic", "asthma", "hypertension", "cancer", "obesity","pneumonia"]
age_patterns = [(r"over (\d+)", ">"), (r"under (\d+)", "<"), (r"older than (\d+)", ">"), (r"younger than (\d+)", "<")]

FHIR_SERVER = "https://hapi.fhir.org/baseR4"


def extract_filters(text):
    doc = nlp(text.lower())
    diagnosis = None
    age_filter = None

    for token in doc:
        if token.text in diagnosis_keywords:
            diagnosis = token.text
            break

    for pattern, op in age_patterns:
        match = re.search(pattern, text.lower())
        if match:
            age_filter = {"operator": op, "value": int(match.group(1))}
            break

    return diagnosis, age_filter



def query_fhir(diagnosis, age_filter=None, condition_name=None):
    condition_url = f"{FHIR_SERVER}/Condition?_count=50&_format=json"
    patient_refs = set()
    pages_loaded = 0
    MAX_PAGES = 50 

    while condition_url:
        response = requests.get(condition_url)
        if response.status_code != 200:
            return f"Error fetching condition data: {response.status_code}", []

        bundle = response.json()

        for entry in bundle.get("entry", []):
            resource = entry.get("resource", {})
            codings = resource.get("code", {}).get("coding", [])
            code_text = resource.get("code", {}).get("text", "")
            found = any(diagnosis.lower() in c.get("display", "").lower() for c in codings)
            found = found or (diagnosis.lower() in code_text.lower())
            if found:
                patient_ref = resource.get("subject", {}).get("reference")
                if patient_ref:
                    patient_refs.add(patient_ref.split("/")[-1])

        
        links = bundle.get("link", [])
        next_link = next((l["url"] for l in links if l.get("relation") == "next"), None)
        condition_url = next_link

        pages_loaded += 1
        if pages_loaded >= MAX_PAGES:
            print("Stopped after 30 pages to prevent long run.")
            break

    return None, fetch_patients(list(patient_refs), age_filter,condition_name=diagnosis)


def fetch_patients(patient_ids, age_filter, condition_name=None):
    patients = []
    seen_combinations = set()

    for pid in patient_ids:
        if len(patients) >= 5:
            break

        res = requests.get(f"{FHIR_SERVER}/Patient/{pid}")
        if res.status_code != 200:
            print(f"Failed to fetch patient {pid}, status code {res.status_code}")
            continue

        patient = res.json()
        print(f"\n--- Raw Patient Data (ID: {pid}) ---")
        print(json.dumps(patient, indent=2))

        name = get_patient_name(patient)
        birth_date = patient.get("birthDate")
        age = calculate_age(birth_date) if birth_date else None
        gender = patient.get("gender", "-")

        if age is None:
            continue

        if age_filter:
            if age_filter["operator"] == ">" and age <= age_filter["value"]:
                print(f"Skipping {name} (age {age}) - does not meet age > {age_filter['value']}")
                continue
            elif age_filter["operator"] == "<" and age >= age_filter["value"]:
                print(f"Skipping {name} (age {age}) - does not meet age < {age_filter['value']}")
                continue

        patient_key = (name, age)
        if patient_key not in seen_combinations:
            seen_combinations.add(patient_key)
            patients.append({
                "id": pid,
                "name": name,
                "age": age,
                "gender": gender,
                "condition": condition_name or "-",
                "country": extract_country(patient)
            })

    return patients


def get_patient_name(patient):
    names = patient.get("name", [])
    if names:
        given = names[0].get("given", [""])[0]
        family = names[0].get("family", "")
        return f"{given} {family}".strip()
    return "Unknown"

def calculate_age(birth_date_str):
    try:
        birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
        today = datetime.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    except:
        return None

def extract_country(patient):
    address = patient.get("address", [])
    if address:
        return address[0].get("country", "-")
    return "-"


@app.route("/query", methods=["POST"])
def handle_query():
    data = request.json
    query = data.get("query", "")
    if not query:
        return jsonify({"error": "No query provided"}), 400

    diagnosis, age_filter = extract_filters(query)
    if not diagnosis:
        return jsonify({"error": "No valid condition found."}), 400

    err, matched = query_fhir(diagnosis, age_filter)
    if err:
        return jsonify({"error": err}), 500

    return jsonify({"patients": matched})

if __name__ == "__main__":
    app.run(debug=True, port=5000)