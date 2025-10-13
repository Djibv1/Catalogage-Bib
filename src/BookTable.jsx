// src/BookTable.jsx
import { useEffect, useState } from "react";
import { getBooks, updateBook, deleteBook } from "./db";
import Papa from "papaparse";

export default function BookTable({ refreshFlag }) {
  const [books, setBooks] = useState([]);
  const [editing, setEditing] = useState({ ean: null, field: null });
  const [tempValue, setTempValue] = useState("");
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [filters, setFilters] = useState({
    genre: "",
    statut: "",
    sortCote: "",
  });

  const genres = [
    "Mangas",
    "Albums",
    "ATP/BEBE",
    "TI",
    "Conte",
    "Livres sonores",
    "Livres CD",
  ];
  const statuts = ["À cataloguer", "En cours", "Catalogué"];

  useEffect(() => {
    load();
  }, [refreshFlag]);

  async function load() {
    const b = await getBooks();
    b.sort((x, y) => (y.date_entree || "").localeCompare(x.date_entree || ""));
    setBooks(b);
  }

  // --- UTILITAIRE DATE ---
  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateInput = (ddmmyyyy) => {
    const [day, month, year] = ddmmyyyy.split("/");
    if (!day || !month || !year) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  async function handleDelete(ean) {
    if (!confirm("Supprimer ce livre ?")) return;
    await deleteBook(ean);
    setSelectedBooks(selectedBooks.filter((e) => e !== ean));
    load();
  }

  async function handleDeleteSelected() {
    if (!confirm(`Supprimer ${selectedBooks.length} livre(s) sélectionné(s) ?`))
      return;
    for (const ean of selectedBooks) await deleteBook(ean);
    setSelectedBooks([]);
    load();
  }

  function startEditing(ean, field, currentValue) {
    setEditing({ ean, field });
    if (field === "date_entree") setTempValue(formatDateDisplay(currentValue));
    else setTempValue(currentValue || "");
  }

  async function stopEditing(book) {
    let value = tempValue;
    if (editing.field === "date_entree") value = formatDateInput(tempValue);
    if (value !== book[editing.field]) {
      await updateBook(book.ean, { [editing.field]: value });
      await load();
    }
    setEditing({ ean: null, field: null });
  }

  function handleKeyDown(e, book) {
    if (e.key === "Enter") stopEditing(book);
    if (e.key === "Escape") setEditing({ ean: null, field: null });
  }

  function toggleSelect(ean) {
    setSelectedBooks((prev) =>
      prev.includes(ean) ? prev.filter((x) => x !== ean) : [...prev, ean]
    );
  }

  function toggleSelectAll(selectAll) {
    if (selectAll) setSelectedBooks(filteredBooks.map((b) => b.ean));
    else setSelectedBooks([]);
  }

  function toggleSelectAllCatalogues(selectAll) {
    if (selectAll) setSelectedBooks(catalogues.map((b) => b.ean));
    else setSelectedBooks([]);
  }

  function toggleSelectCatalogue(ean) {
    setSelectedBooks((prev) =>
      prev.includes(ean) ? prev.filter((x) => x !== ean) : [...prev, ean]
    );
  }

  async function applyBulkUpdate(field, value) {
    for (const ean of selectedBooks) {
      await updateBook(ean, {
        [field]: field === "date_entree" ? formatDateInput(value) : value,
      });
    }
    setSelectedBooks([]);
    load();
  }

  function getStatusStyle(statut) {
    switch (statut) {
      case "À cataloguer":
        return {
          background: "#fee2e2",
          fontWeight: 400,
          padding: "2px 6px",
          borderRadius: "6px",
        };
      case "En cours":
        return {
          background: "#ffedd5",
          color: "#c2410c",
          fontWeight: 400,
          padding: "2px 6px",
          borderRadius: "6px",
        };
      case "Catalogué":
        return {
          background: "#dcfce7",
          fontWeight: 400,
          padding: "2px 6px",
          borderRadius: "6px",
        };
      default:
        return {};
    }
  }

  // --- FILTRAGE ---
  let filteredBooks = books.filter((b) => b.statut !== "Catalogué");
  if (filters.genre)
    filteredBooks = filteredBooks.filter((b) => b.genre === filters.genre);
  if (filters.statut)
    filteredBooks = filteredBooks.filter((b) => b.statut === filters.statut);
  if (filters.sortCote)
    filteredBooks = filteredBooks.sort((a, b) => a.cote.localeCompare(b.cote));

  const catalogues = books.filter((b) => b.statut === "Catalogué");

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>À cataloguer / En cours ({filteredBooks.length})</h2>

      {/* FILTRES */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}
      >
        <select
          value={filters.genre}
          onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
        >
          <option value="">Filtrer par genre...</option>
          {genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>

        <select
          value={filters.statut}
          onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
        >
          <option value="">Filtrer par statut...</option>
          {statuts.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.sortCote}
          onChange={(e) => setFilters({ ...filters, sortCote: e.target.value })}
        >
          <option value="">Trier par cote...</option>
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>

      {/* Actions groupées */}
      {selectedBooks.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#f9f9f9",
            marginBottom: 12,
          }}
        >
          <strong>{selectedBooks.length} livre(s) sélectionné(s)</strong>

          <select onChange={(e) => applyBulkUpdate("genre", e.target.value)}>
            <option value="">Ajouter un genre...</option>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>

          <input
            placeholder="Ajouter une cote..."
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await applyBulkUpdate("cote", e.target.value);
                e.target.value = "";
              }
            }}
          />
          <input
            placeholder="Modifier auteur..."
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await applyBulkUpdate("auteur", e.target.value);
                e.target.value = "";
              }
            }}
          />
          <input
            placeholder="Modifier titre..."
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await applyBulkUpdate("titre", e.target.value);
                e.target.value = "";
              }
            }}
          />
          <input
            placeholder="Date JJ/MM/AAAA..."
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await applyBulkUpdate("date_entree", e.target.value);
                e.target.value = "";
              }
            }}
          />
          <select onChange={(e) => applyBulkUpdate("statut", e.target.value)}>
            <option value="">Modifier statut...</option>
            {statuts.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={handleDeleteSelected}
            style={{
              padding: "6px 12px",
              background: "#dc2626",
              color: "white",
              borderRadius: 6,
            }}
          >
            Supprimer la sélection
          </button>
        </div>
      )}

      {/* Tableau à traiter */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#f3f4f6" }}>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={
                  selectedBooks.length === filteredBooks.length &&
                  filteredBooks.length > 0
                }
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
            </th>
            <th>EAN</th>
            <th>Date d’entrée</th>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Cote</th>
            <th>Genre</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map((b) => (
            <tr key={b.ean} style={{ borderBottom: "1px solid #ddd" }}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedBooks.includes(b.ean)}
                  onChange={() => toggleSelect(b.ean)}
                />
              </td>
              <td>{b.ean}</td>
              <td
                onDoubleClick={() =>
                  startEditing(b.ean, "date_entree", b.date_entree)
                }
                style={{ cursor: "pointer" }}
              >
                {editing.ean === b.ean && editing.field === "date_entree" ? (
                  <input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => stopEditing(b)}
                    onKeyDown={(e) => handleKeyDown(e, b)}
                    autoFocus
                    placeholder="JJ/MM/AAAA"
                  />
                ) : (
                  formatDateDisplay(b.date_entree)
                )}
              </td>
              <td
                onDoubleClick={() => startEditing(b.ean, "titre", b.titre)}
                style={{ cursor: "pointer" }}
              >
                {editing.ean === b.ean && editing.field === "titre" ? (
                  <input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => stopEditing(b)}
                    onKeyDown={(e) => handleKeyDown(e, b)}
                    autoFocus
                  />
                ) : (
                  b.titre
                )}
              </td>
              <td
                onDoubleClick={() => startEditing(b.ean, "auteur", b.auteur)}
                style={{ cursor: "pointer" }}
              >
                {editing.ean === b.ean && editing.field === "auteur" ? (
                  <input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => stopEditing(b)}
                    onKeyDown={(e) => handleKeyDown(e, b)}
                    autoFocus
                  />
                ) : (
                  b.auteur
                )}
              </td>
              <td
                onDoubleClick={() => startEditing(b.ean, "cote", b.cote)}
                style={{ cursor: "pointer" }}
              >
                {editing.ean === b.ean && editing.field === "cote" ? (
                  <input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => stopEditing(b)}
                    onKeyDown={(e) => handleKeyDown(e, b)}
                    autoFocus
                  />
                ) : (
                  b.cote
                )}
              </td>
              <td
                onDoubleClick={() => startEditing(b.ean, "genre", b.genre)}
                style={{ cursor: "pointer" }}
              >
                {editing.ean === b.ean && editing.field === "genre" ? (
                  <select
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => stopEditing(b)}
                    onKeyDown={(e) => handleKeyDown(e, b)}
                    autoFocus
                  >
                    <option value="">(Non défini)</option>
                    {genres.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  b.genre
                )}
              </td>
              <td
                onDoubleClick={() => startEditing(b.ean, "statut", b.statut)}
                style={{ cursor: "pointer" }}
              >
                {editing.ean === b.ean && editing.field === "statut" ? (
                  <select
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => stopEditing(b)}
                    onKeyDown={(e) => handleKeyDown(e, b)}
                    autoFocus
                    style={{ width: "100%" }}
                  >
                    {statuts.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span style={getStatusStyle(b.statut)}>{b.statut}</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => handleDelete(b.ean)}
                  style={{ color: "crimson" }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tableau catalogués */}
      <h2 style={{ marginTop: 40 }}>Catalogués ({catalogues.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#d1fae5" }}>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={
                  selectedBooks.length === catalogues.length &&
                  catalogues.length > 0
                }
                onChange={(e) => toggleSelectAllCatalogues(e.target.checked)}
              />
            </th>
            <th>EAN</th>
            <th>Date d’entrée</th>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Cote</th>
            <th>Genre</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {catalogues.map((b) => (
            <tr key={b.ean} style={{ borderBottom: "1px solid #ddd" }}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedBooks.includes(b.ean)}
                  onChange={() => toggleSelectCatalogue(b.ean)}
                />
              </td>
              <td>{b.ean}</td>
              <td>{formatDateDisplay(b.date_entree)}</td>
              <td>{b.titre}</td>
              <td>{b.auteur}</td>
              <td>{b.cote}</td>
              <td>{b.genre}</td>
              <td>
                <span style={getStatusStyle(b.statut)}>{b.statut}</span>
              </td>
              <td>
                <button
                  onClick={() => handleDelete(b.ean)}
                  style={{ color: "crimson" }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
