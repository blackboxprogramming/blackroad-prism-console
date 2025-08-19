from __future__ import annotations
from io import StringIO
from typing import Dict, Optional

# RDKit core
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, Crippen, rdMolDescriptors
from rdkit.Chem.MolStandardize import rdMolStandardize

# MDAnalysis for RMSD
import MDAnalysis as mda
from MDAnalysis.analysis.rms import rmsd as mda_rmsd

# ASE for simple relax from XYZ
from ase.io import read as ase_read, write as ase_write
from ase.calculators.emt import EMT
from ase.optimize import BFGS

# OpenMM for protein PDB minimization
from openmm import app, unit
import openmm as mm


# ---------- RDKit helpers ----------
def _sanitize_mol(mol: Chem.Mol) -> Chem.Mol:
    Chem.SanitizeMol(mol)
    return mol

def _cleanup_parent_neutral(mol: Chem.Mol) -> Chem.Mol:
    params = rdMolStandardize.CleanupParameters()
    mol = rdMolStandardize.Cleanup(mol, params)
    lfc = rdMolStandardize.LargestFragmentChooser()
    mol = lfc.choose(mol)
    uncharger = rdMolStandardize.Uncharger()
    mol = uncharger.uncharge(mol)
    normalizer = rdMolStandardize.Normalizer()
    mol = normalizer.normalize(mol)
    reionizer = rdMolStandardize.Reionizer()
    mol = reionizer.reionize(mol)
    return _sanitize_mol(mol)

def standardize_smiles(smiles: str) -> Dict[str, str]:
    """
    Returns canonical, neutralized, and parent (largest fragment) SMILES.
    """
    base = Chem.MolFromSmiles(smiles)
    if base is None:
        raise ValueError("Invalid SMILES")
    base = _sanitize_mol(base)

    parent_neutral = _cleanup_parent_neutral(Chem.Mol(base))
    return {
        "canonical_smiles": Chem.MolToSmiles(base, canonical=True),
        "parent_smiles": Chem.MolToSmiles(parent_neutral, canonical=True),
        "neutralized_smiles": Chem.MolToSmiles(parent_neutral, canonical=True),
    }

def descriptors_from_smiles(smiles: str) -> Dict[str, float]:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError("Invalid SMILES")
    mol = _sanitize_mol(mol)
    return {
        "MolWt": Descriptors.MolWt(mol),
        "TPSA": rdMolDescriptors.CalcTPSA(mol),
        "NumRotatableBonds": rdMolDescriptors.CalcNumRotatableBonds(mol),
        "NumHBD": rdMolDescriptors.CalcNumHBD(mol),
        "NumHBA": rdMolDescriptors.CalcNumHBA(mol),
        "RingCount": rdMolDescriptors.CalcNumRings(mol),
        "LogP": Crippen.MolLogP(mol),
        "HBA_HBD_Sum": rdMolDescriptors.CalcNumHBA(mol) + rdMolDescriptors.CalcNumHBD(mol),
    }

def embed_and_minimize_uff(smiles: str, num_confs: int = 10, seed: int = 7) -> Dict[str, str]:
    """
    Generates 3D conformers with ETKDG and UFF-minimizes them.
    Returns a MOL block (lowest-energy conformer) and canonical SMILES.
    """
    mol = Chem.AddHs(Chem.MolFromSmiles(smiles))
    if mol is None:
        raise ValueError("Invalid SMILES")
    params = AllChem.ETKDGv3()
    params.randomSeed = seed
    conf_ids = list(AllChem.EmbedMultipleConfs(mol, numConfs=num_confs, params=params))
    res = AllChem.UFFOptimizeMoleculeConfs(mol, maxIters=200)
    energies = [r[1] for r in res]
    best_conf_id = conf_ids[int(sorted(zip(range(len(conf_ids)), energies), key=lambda x: x[1])[0][0])]
    molblock = Chem.MolToMolBlock(mol, confId=best_conf_id)
    can = Chem.MolToSmiles(Chem.RemoveHs(mol), canonical=True)
    return {"canonical_smiles": can, "molblock": molblock}

# ---------- MDAnalysis ----------
def rmsd_pdb(pdb_ref: str, pdb_mobile: str) -> float:
    """
    Computes RMSD (Å) after alignment between two PDB structures.
    """
    u_ref = mda.Universe(StringIO(pdb_ref), format="PDB")
    u_mob = mda.Universe(StringIO(pdb_mobile), format="PDB")
    return float(mda_rmsd(u_mob.atoms.positions, u_ref.atoms.positions, center=True, superposition=True))

# ---------- ASE ----------
def ase_relax_xyz(xyz_text: str, fmax: float = 0.05, steps: int = 200) -> str:
    """
    Relax coordinates from an XYZ string using EMT + BFGS.
    Returns a new XYZ string.
    """
    atoms = ase_read(StringIO(xyz_text), format="xyz")
    atoms.calc = EMT()
    opt = BFGS(atoms, logfile=None)
    opt.run(fmax=fmax, steps=steps)
    out = StringIO()
    ase_write(out, atoms, format="xyz")
    return out.getvalue()

# ---------- OpenMM ----------
def openmm_minimize_pdb(pdb_text: str, platform: Optional[str] = None, max_iters: int = 500) -> str:
    """
    Minimize a protein PDB using Amber14 with OpenMM.
    NOTE: small molecules/ligands require GAFF/OpenFF; this assumes a biomolecular PDB.
    """
    pdb = app.PDBFile(StringIO(pdb_text))
    forcefield = app.ForceField("amber14-all.xml", "amber14/tip3p.xml")
    modeller = app.Modeller(pdb.topology, pdb.positions)

    system = forcefield.createSystem(modeller.topology, nonbondedMethod=app.NoCutoff, constraints=app.HBonds)
    integrator = mm.LangevinIntegrator(300*unit.kelvin, 1.0/unit.picosecond, 0.002*unit.picoseconds)

    if platform:
        plat = mm.Platform.getPlatformByName(platform)
        sim = app.Simulation(modeller.topology, system, integrator, plat)
    else:
        sim = app.Simulation(modeller.topology, system, integrator)

    sim.context.setPositions(modeller.positions)
    mm.LocalEnergyMinimizer.minimize(sim.context, maxIterations=max_iters)

    out = StringIO()
    app.PDBFile.writeFile(sim.topology, sim.context.getState(getPositions=True).getPositions(), out)
    return out.getvalue()
