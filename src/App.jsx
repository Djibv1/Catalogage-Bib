// src/App.jsx
import { useState } from "react";
import BookForm from "./BookForm";
import BookTable from "./BookTable";

export default function App() {
  const [refreshFlag, setRefreshFlag] = useState(0);

  function handleBookAdded() {
    setRefreshFlag((f) => f + 1); // 🔁 recharge le tableau instantanément
  }

  return (
    <div style={{ padding: 20, maxWidth: "80%", margin: "auto" }}>
      <h1 style={{ alignItems: "auto" }}> Suivi des livres à cataloguer</h1>
      <BookForm onBookAdded={handleBookAdded} />
      <BookTable refreshFlag={refreshFlag} />
    </div>
  );
}
