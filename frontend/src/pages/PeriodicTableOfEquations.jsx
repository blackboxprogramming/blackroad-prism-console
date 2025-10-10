import React from 'react'

const categories = [
  {
    title: 'Structure',
    color: 'bg-blue-100/20 border border-blue-300/30',
    items: [
      { eq: 'A𝑥 = b', desc: 'Linear systems – universal constraints' },
      { eq: 'det(A) = 0', desc: 'Threshold between reversible & singular' },
      { eq: 'e^{iπ}+1=0', desc: 'Numbers unify through symmetry' },
      { eq: '∇f(x)=0', desc: 'Equilibrium / optimization point' },
    ],
  },
  {
    title: 'Dynamics',
    color: 'bg-red-100/20 border border-red-300/30',
    items: [
      { eq: 'F=ma', desc: 'Classical motion' },
      { eq: 'δS=0', desc: 'Least action principle' },
      { eq: 'E=mc²', desc: 'Mass-energy equivalence' },
      { eq: 'd²x/dt²=-ω²x', desc: 'Oscillatory systems' },
    ],
  },
  {
    title: 'Fields & Waves',
    color: 'bg-indigo-100/20 border border-indigo-300/30',
    items: [
      { eq: '∂²φ/∂t²=c²∇²φ', desc: 'Wave propagation law' },
      { eq: 'iħ∂Ψ/∂t=HΨ', desc: 'Quantum evolution' },
      { eq: '∂_μ g^{μν} ∂_ν A=0', desc: 'Light in curved space-time' },
      { eq: 'U(t)=e^{-iHt/ħ}', desc: 'Unitary time evolution' },
    ],
  },
  {
    title: 'Entropy & Thermodynamics',
    color: 'bg-yellow-100/20 border border-yellow-300/30',
    items: [
      { eq: 'S=k_B lnΩ', desc: 'Entropy from microstates' },
      { eq: 'F=E−TS', desc: 'Free energy relation' },
      { eq: 'H=−Σp ln p', desc: 'Information entropy' },
      { eq: 'P_i=e^{−βE_i}/Z', desc: 'Boltzmann distribution' },
    ],
  },
  {
    title: 'Quantum & Information',
    color: 'bg-green-100/20 border border-green-300/30',
    items: [
      { eq: '[x,p]=iħ', desc: 'Uncertainty principle' },
      { eq: 'Oψ=λψ', desc: 'Eigenvalue structure' },
      { eq: 'ρ=|Ψ⟩⟨Ψ|', desc: 'Quantum state density' },
      { eq: 'ψ_{n+1}+ψ_{n−1}+2cos(2πnφ)ψ_n=Eψ_n', desc: 'Hofstadter butterfly' },
    ],
  },
  {
    title: 'Computation & Learning',
    color: 'bg-purple-100/20 border border-purple-300/30',
    items: [
      { eq: 'P(H|D)=P(D|H)P(H)/P(D)', desc: 'Bayes’ theorem' },
      { eq: '𝓛=−Σ y ln ŷ', desc: 'Cross-entropy loss' },
      { eq: 'dθ/dt=−∇_θ𝓛', desc: 'Gradient descent' },
      { eq: 'I(X;Y)=Σ p ln(p/pp)', desc: 'Mutual information' },
    ],
  },
  {
    title: 'Life & Cognition',
    color: 'bg-emerald-100/20 border border-emerald-300/30',
    items: [
      { eq: '𝓕=E_q[ln q−ln p]', desc: 'Free energy principle' },
      { eq: '∇·J+∂ρ/∂t=0', desc: 'Homeostasis / conservation' },
      { eq: 'dU=TdS−PdV+μdN', desc: 'Biochemical energy flow' },
      { eq: 'Fitness∝e^{−βE}', desc: 'Evolutionary selection law' },
    ],
  },
]

export default function PeriodicTableOfEquations(){
  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Periodic Table of Equations</h1>
        <p className="text-sm text-slate-300">
          A cross-domain synthesis of the equations that shape structure, motion, energy, information, and life.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map(category => (
          <section
            key={category.title}
            className={`p-4 rounded-2xl shadow border backdrop-blur bg-slate-900/40 ${category.color}`}
          >
            <h2 className="text-lg font-semibold mb-3 text-center text-slate-100">{category.title}</h2>
            <ul className="space-y-3">
              {category.items.map(item => (
                <li key={item.eq} className="border-b border-slate-800/60 pb-2 last:border-none last:pb-0">
                  <p className="font-mono text-sm text-slate-100">{item.eq}</p>
                  <p className="text-xs text-slate-300">{item.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="text-center text-xs text-slate-400">
        Inspired by the unifying laws of nature — from linear algebra to quantum cognition.
      </footer>
    </div>
  )
}
