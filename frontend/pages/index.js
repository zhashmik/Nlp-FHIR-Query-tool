"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const suggestionMap = {
  list: ["diabetic", "asthma", "hypertension", "cancer", "obesity", "pneumonia"],
  show: ["diabetic", "asthma", "hypertension", "cancer", "obesity", "pneumonia"],
  find: ["diabetic", "asthma", "hypertension", "cancer", "obesity", "pneumonia"],
  get: ["diabetic", "asthma", "hypertension", "cancer", "obesity", "pneumonia"],
  diabetic: ["patients"],
  asthma: ["patients"],
  hypertension: ["patients"],
  cancer: ["patients"],
  obesity: ["patients"],
  pneumonia: ["patients"],
  patients: ["over", "under", "younger", "older"],
  over: ["30", "40", "50", "60", "70"],
  under: ["30", "40", "50", "60", "70"],
  younger: ["30", "40", "50", "60", "70"],
  older: ["30", "40", "50", "60", "70"]
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoComplete, setAutoComplete] = useState([]);

  // Filters
  const [ageRange, setAgeRange] = useState([0, 120]);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    const words = query.trim().split(" ");
    const lastWord = words[words.length - 1]?.toLowerCase();
    const previousWord = words[words.length - 2]?.toLowerCase();

    let suggestions = [];
    if (suggestionMap[lastWord]) {
      suggestions = suggestionMap[lastWord].map((s) => `${query.trim()} ${s}`);
    } else if (suggestionMap[previousWord]) {
      suggestions = suggestionMap[previousWord]
        .filter((s) => s.startsWith(lastWord))
        .map((s) => words.slice(0, -1).join(" ") + " " + s);
    }
    setAutoComplete(suggestions);
  }, [query]);

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion + " ");
    setAutoComplete([]);
  };

  const handleQuerySubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://nlp-fhir-query-tool-back-end.onrender.com/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = patients.filter((p) => {
      const matchAge = typeof p.age !== "number" || (p.age >= ageRange[0] && p.age <= ageRange[1]);
      const matchGender = !selectedGender || p.gender?.toLowerCase() === selectedGender;
      const matchCondition = !selectedCondition || p.condition?.toLowerCase().includes(selectedCondition);
      const matchCountry = !selectedCountry || p.country?.toLowerCase().includes(selectedCountry);
      return matchAge && matchGender && matchCondition && matchCountry;
    });
    setFilteredPatients(filtered);
  }, [patients, ageRange, selectedGender, selectedCondition, selectedCountry]);

  const chartData = filteredPatients
    .filter((p) => typeof p.age === "number")
    .map((p) => ({ name: p.name, age: p.age }));

  const genderData = Object.entries(
    filteredPatients.reduce((acc, p) => {
      const g = p.gender || "Unknown";
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {})
  ).map(([gender, count]) => ({ gender, count }));

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">FHIR Query UI</h1>

      {/* Query input */}
      <div className="flex flex-col gap-2 max-w-xl">
        <div className="relative">
          <Input
            placeholder="Enter query e.g., 'List diabetic patients over 50'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {autoComplete.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 border rounded bg-white shadow-md text-sm mt-1">
              {autoComplete.map((s, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button onClick={handleQuerySubmit} disabled={loading} className="w-fit">
          {loading ? "Loading..." : "Submit"}
        </Button>


      </div>

      {/* Filters section: now always visible */}
      <div className="flex gap-4 flex-wrap mt-4 mb-6 border p-4 rounded-lg bg-gray-50">
        <div>
          <label className="text-sm block">Age Range</label>
          <input
            type="number"
            placeholder="Min"
            className="border rounded p-1 mr-2 w-20"
            value={ageRange[0]}
            onChange={(e) => setAgeRange([+e.target.value, ageRange[1]])}
          />
          <input
            type="number"
            placeholder="Max"
            className="border rounded p-1 w-20"
            value={ageRange[1]}
            onChange={(e) => setAgeRange([ageRange[0], +e.target.value])}
          />
        </div>

        <div>
          <label className="text-sm block">Gender</label>
          <select
            className="border rounded p-1"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value.toLowerCase())}
          >
            <option value="">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm block">Condition</label>
          <input
            type="text"
            className="border rounded p-1"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value.toLowerCase())}
          />
        </div>

        <div>
          <label className="text-sm block">Country</label>
          <input
            type="text"
            className="border rounded p-1"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value.toLowerCase())}
          />
        </div>
      </div>

      {/* Results */}
      {filteredPatients.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="overflow-x-auto">
            <CardContent className="p-4">
              <h2 className="text-xl font-medium mb-4">Patient Table</h2>
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="border-b p-2">ID</th>
                    <th className="border-b p-2">Name</th>
                    <th className="border-b p-2">Age</th>
                    <th className="border-b p-2">Gender</th>
                    <th className="border-b p-2">Condition</th>
                    <th className="border-b p-2">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p, index) => (
                    <tr key={index}>
                      <td className="border-b p-2">{p.id}</td>
                      <td className="border-b p-2">{p.name}</td>
                      <td className="border-b p-2">{p.age ?? "-"}</td>
                      <td className="border-b p-2">{p.gender ?? "-"}</td>
                      <td className="border-b p-2">{p.condition ?? "-"}</td>
                      <td className="border-b p-2">{p.country ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-medium mb-4">Age Distribution</h2>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="age" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-medium mb-4">Gender Distribution</h2>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={genderData}>
                    <XAxis dataKey="gender" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
