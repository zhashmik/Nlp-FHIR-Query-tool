# AI on FHIR – Natural Language Query to FHIR API

# Part 1: Backend & NLP Integration (Python)
This project converts **natural language queries** into **FHIR-compliant API calls** using real patient and condition data from the public [HAPI FHIR R4 server](https://hapi.fhir.org/baseR4).

---

## 🚀 Features

- Uses spaCy NLP to extract medical condition and age constraints.
- Queries real **FHIR Condition and Patient resources**.
- Filters patients by age and condition match.
- Removes duplicate records and skips patients with unknown age.
- Prints matching patients and a summary of all queries.

---
Instructions to use: 

1. Clone or download the repository
2. Create a virtual environment and activate it
3. Install dependencies
4. Run the tool

Example Queries (hardcoded in the script)
1. Show me all diabetic patients over 50
2. List asthma patients under 30
3. Find cancer patients younger than 40

Sample Output

======= Summary of All Queries and Matches =======

Query: Show me all diabetic patients over 50
Matched Patients:
- Ernesto186 Villegas15, Age: 61
- Miesha237 Cremin516, Age: 57

Query: List asthma patients under 30
Matched Patients:
- Anna  Singh2, Age: 5
- Harry Hay, Age: 5
- Willow Greens, Age: 5
- Xavier Cooper, Age: 5
- Basanta Hoffmann, Age: 24

Query: Find Pneumonia patients younger than 70
Matched Patients:
- Pepito Volainas, Age: 59
- 4567 Zhang, Age: 50
- Anderson154 Kovacek682, Age: 17
- Dudley365 Denesik803, Age: 28
- James Davidzo, Age: 45