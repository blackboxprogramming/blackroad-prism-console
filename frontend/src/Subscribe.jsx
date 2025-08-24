import React, { useEffect, useState } from 'react';
import { me } from './api';
import { fetchConfig, fetchStatus, startCheckout, openPortal } from './subscribeApi';

const PLANS = [
  { id: 'starter', name: 'Starter', price: { month: 0, year: 0 }, features: ['Community access', 'Limited features'] },
  { id: 'pro', name: 'Pro', price: { month: 29, year: 290 }, features: ['Feature set for active builders'], popular: true },
  { id: 'infinity', name: 'Infinity', price: { month: 99, year: 990 }, features: ['Full stack', 'Priority access', 'Advanced labs'] }
];

export default function Subscribe(){
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [interval, setInterval] = useState('month');
  const [coupon, setCoupon] = useState('');

  useEffect(()=>{ fetchConfig().then(setConfig); me().then(setUser).catch(()=>{}); },[]);
  useEffect(()=>{ if(user) fetchStatus().then(setStatus); },[user]);

  const inTest = config && config.testMode;

  function handleCheckout(planId){
    if(inTest) return;
    startCheckout(planId, interval, coupon || undefined).then(d=>{ if(d.url) window.location = d.url; });
  }

  function manageBilling(){
    openPortal().then(d=>{ if(d.url) window.location = d.url; });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl mb-2">Subscribe to BlackRoad</h1>
      <p className="mb-6 text-slate-300">Choose a plan that fits your journey.</p>

      {config && config.testMode && (
        <div className="p-4 mb-4 border-l-4" style={{borderColor:'#FDBA2D',background:'#1e293b'}}>
          Test Mode enabled. Configure Stripe keys to activate real checkout.
        </div>
      )}

      {!user && (
        <div className="mb-6">
          <a href="/" className="underline" style={{color:'#FF4FD8'}}>Sign in to continue</a>
        </div>
      )}

      {user && status && status.status !== 'none' && (
        <StatusPanel status={status} manageBilling={manageBilling} />
      )}

      <IntervalToggle interval={interval} setInterval={setInterval} />

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(p => (
          <PlanCard key={p.id} plan={p} interval={interval} onSelect={()=>handleCheckout(p.id)} disabled={!user || inTest} />
        ))}
      </div>

      <PromoInput coupon={coupon} setCoupon={setCoupon} />

      {status && status.invoices && status.invoices.length > 0 && (
        <InvoiceTable invoices={status.invoices} />
      )}
    </div>
  );
}

function IntervalToggle({ interval, setInterval }){
  return (
    <div className="mb-6 space-x-2">
      {['month','year'].map(i => (
        <button key={i} className="px-4 py-2 rounded" style={{background: interval===i? '#FF4FD8':'#1e293b', color: interval===i?'#000':'#fff'}} onClick={()=>setInterval(i)}>
          {i === 'month' ? 'Monthly' : 'Annual'}
        </button>
      ))}
    </div>
  );
}

function PlanCard({ plan, interval, onSelect, disabled }){
  const price = plan.price[interval];
  return (
    <div className="border p-6 rounded-lg bg-slate-900 flex flex-col" style={{borderColor:'#0096FF'}}>
      {plan.popular && <span className="text-xs mb-2" style={{color:'#FF4FD8'}}>Most Popular</span>}
      <h2 className="text-xl mb-2">{plan.name}</h2>
      <div className="text-2xl mb-4">${price}/{interval==='month'?'mo':'yr'}</div>
      <ul className="text-sm mb-4 space-y-1 flex-1">
        {plan.features.map(f=> <li key={f}>• {f}</li>)}
      </ul>
      <button disabled={disabled} className="px-4 py-2 rounded mt-auto" style={{background:'#FF4FD8',color:'#000',opacity:disabled?0.5:1}} onClick={onSelect}>Subscribe</button>
    </div>
  );
}

function PromoInput({ coupon, setCoupon }){
  return (
    <div className="mt-6 max-w-sm">
      <input type="text" value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Promo code" className="w-full p-2 text-black" />
    </div>
  );
}

function StatusPanel({ status, manageBilling }){
  const end = status.currentPeriodEnd ? new Date(status.currentPeriodEnd * 1000).toLocaleDateString() : '';
  return (
    <div className="mb-6 p-4 border rounded" style={{borderColor:'#FDBA2D'}}>
      <div className="mb-2">Current Plan: {status.planId} ({status.status})</div>
      {end && <div className="mb-2">Renews on {end}</div>}
      <button className="px-3 py-2 rounded" style={{background:'#0096FF',color:'#000'}} onClick={manageBilling}>Manage billing</button>
    </div>
  );
}

function InvoiceTable({ invoices }){
  return (
    <table className="mt-8 w-full text-sm">
      <thead><tr className="text-left"><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {invoices.map(inv => (
          <tr key={inv.id} className="border-t border-slate-800">
            <td>{new Date(inv.created * 1000).toLocaleDateString()}</td>
            <td>{(inv.total/100).toFixed(2)}</td>
            <td>{inv.status}</td>
            <td>{inv.hosted_invoice_url && <a href={inv.hosted_invoice_url} className="underline" target="_blank" rel="noreferrer">View</a>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

