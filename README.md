# Nlp-FHIR-Query-tool
A full-stack web application built with React (frontend) and Flask (backend) that allows users to search and filter patient data using natural-language-like queries. Features include auto-suggestions, filterable patient tables, and dynamic visualizations like age and gender distribution charts.

## Features

-  Natural Language Query Processing with spaCy
-  FHIR Data Query Support
-  Auto suggestions
---

## Project Structure

AI-on-FHIR/
├── backend/ # Flask API + NLP logic
│ ├── main.py
│ ├── requirements.txt
│ └── ...
└── frontend/ # Next.js UI
├── pages/
├── components/
├── public/
└── ...

# Instructions to use: 

1. Clone or download the repository
2. Create a virtual environment and activate it
3. Install dependencies
4. Run the tool

#Example Queries 
1. Show me all diabetic patients over 50
2. List asthma patients under 30
3. Find cancer patients younger than 40


# Deployment
Backend: Hosted on Render: https://nlp-fhir-query-tool-back-end.onrender.com/
Frontend: Hosted on Vercel : https://nlp-fhir-query-tool.vercel.app/

# TODO / Improvements
 Add OAuth2 + SMART on FHIR
 Implement RBAC (Clinician, Researcher)
 Integrate real FHIR data source or sandbox API
 Add audit logging for query history




