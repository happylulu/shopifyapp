import { useEffect, useState } from "react";

interface CustomerData {
  points: number;
  last_order: string;
}

export default function LoyaltyPage() {
  const [data, setData] = useState<CustomerData | null>(null);
  const [customerId, setCustomerId] = useState<string>("1");

  useEffect(() => {
    fetch(`http://localhost:8000/customers/${customerId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, [customerId]);

  return (
    <main style={{ padding: 40 }}>
      <h1>Loyalty Dashboard</h1>
      <label>
        Customer ID:
        <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
      </label>
      {data ? (
        <div>
          <p>Points Balance: {data.points}</p>
          <p>Last Order: {new Date(data.last_order).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No data</p>
      )}
    </main>
  );
}
