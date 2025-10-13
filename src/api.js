// src/api.js
export async function getBookDataFromEAN(ean) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${ean}`
    );
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      return {
        ean,
        titre: "(Titre inconnu)",
        auteur: "",
        genre: "",
        cote: "",
        statut: "À cataloguer",
        date_entree: new Date().toISOString().split("T")[0],
      };
    }

    const info = data.items[0].volumeInfo;
    return {
      ean,
      titre: info.title || "(Titre inconnu)",
      auteur: (info.authors && info.authors.join(", ")) || "",
      genre: (info.categories && info.categories[0]) || "",
      cote: "",
      statut: "À cataloguer",
      date_entree: new Date().toISOString().split("T")[0],
    };
  } catch (e) {
    console.error("Erreur API Google Books", e);
    return null;
  }
}
