// src/BookForm.jsx
import { useState } from "react";
import { addBook } from "./db";
import { getBookDataFromEAN } from "./api";
import Papa from "papaparse";

export default function BookForm({ onBookAdded }) {
  const [ean, setEan] = useState("");
  const [loading, setLoading] = useState(false);

  // ➕ Ajout d'un livre à partir de l'EAN
  async function handleAdd() {
    if (!ean.trim()) return;
    setLoading(true);
    const data = await getBookDataFromEAN(ean.trim());
    if (data) {
      await addBook(data);
      onBookAdded(); // 🔁 met à jour le tableau
    }
    setEan("");
    setLoading(false);
  }

  // 📂 Import CSV
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        for (const row of results.data) {
          if (!row.EAN) continue;
          const book = {
            ean: row.EAN,
            titre: row.Titre || "(Titre inconnu)",
            auteur: row.Auteur || "",
            genre: row.Genre || "",
            cote: row.Cote || "",
            statut: row.Statut || "À cataloguer",
            date_entree: row["Date d’entrée"]
              ? new Date(row["Date d’entrée"]).toLocaleDateString("fr-FR")
              : new Date().toLocaleDateString("fr-FR"),
          };
          await addBook(book);
        }
        onBookAdded(); // 🔁 recharge immédiatement le tableau
      },
    });
  }

  return (
    <div className="card">
      <h2> Ajouter un livre</h2>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={ean}
          placeholder="EAN du livre"
          onChange={(e) => setEan(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={handleAdd} disabled={loading}>
          {loading ? "Recherche..." : "Ajouter"}
        </button>
      </div>

      <p style={{ marginTop: 10 }}>ou importer un fichier CSV :</p>
      <input type="file" accept=".csv" onChange={handleFile} />
    </div>
  );
}
