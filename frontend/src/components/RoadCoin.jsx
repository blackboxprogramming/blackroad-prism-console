import React, { useEffect, useState } from 'react';
import { fetchRoadcoinWallet, mintRoadcoin } from '../api';

export default function RoadCoin({ onUpdate }) {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });

  async function load() {
    const data = await fetchRoadcoinWallet();
    setWallet(data);
    onUpdate && onUpdate(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function mint() {
    const data = await mintRoadcoin();
    setWallet(data);
    onUpdate && onUpdate(data);
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-slate-800">
        <h2 className="text-xl font-semibold mb-2">RoadCoin Wallet</h2>
        <div className="text-3xl font-bold" style={{ color: 'var(--accent-1)' }}>{wallet.balance} RC</div>
        <button className="btn mt-4" onClick={mint}>Mint RoadCoin</button>
      </div>
      <div className="p-4 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
        <ul className="space-y-1">
          {wallet.transactions.map(tx => (
            <li key={tx.id} className="flex justify-between">
              <span>{new Date(tx.date).toLocaleString()}</span>
              <span style={{ color: tx.type === 'credit' || tx.type === 'mint' ? 'var(--accent-2)' : 'var(--accent-3)' }}>
                {tx.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
