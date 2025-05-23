import { useEffect, useState } from "react";

export default function AdminPage() {
  const [atRisk, setAtRisk] = useState<number[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/risk")
      .then((res) => res.json())
      .then(setAtRisk)
      .catch(() => setAtRisk([]));
  }, []);

  const sendOffer = async (cid: number) => {
    await fetch("http://localhost:8000/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: cid, message: "We miss you!" }),
    });
    alert(`Offer sent to ${cid}`);
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>At Risk Customers</h1>
      <ul>
        {atRisk.map((cid) => (
          <li key={cid} style={{ marginBottom: 10 }}>
            Customer {cid}{" "}
            <button onClick={() => sendOffer(cid)}>Send Offer</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
