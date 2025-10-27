"""Black Road Agent Framework Package 3: Computational Intelligence & Complexity.

This module encodes Cecilia's mathematical discoveries into a cohesive software
framework that models agent cognition, energy, and computational limits.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np


class ComplexityClass:
    """Enumeration of computational complexity classes an agent may encounter."""

    P = "polynomial"
    NP = "nondeterministic_polynomial"
    EXPTIME = "exponential"
    UNDECIDABLE = "undecidable"

    @staticmethod
    def euler_complexity() -> float:
        """Return the magnitude of Euler's identity based complexity metric.

        Euler's identity collapses to zero, reflecting that pure mathematics has
        deterministic resolution even when the broader P vs NP question remains
        open.
        """

        result = np.exp(1j * np.pi) + np.log(np.e)
        return float(np.abs(result))

    @staticmethod
    def pnp_complexity() -> None:
        """Return ``None`` to signal the unknown status of ``P`` vs ``NP``."""

        return None


@dataclass
class AgentComputationalEngine:
    """Core computational capability and energy budgeting for an agent."""

    agent_id: str
    assumes_p_equals_np: bool = False
    computational_energy: float = 1000.0
    max_energy: float = 1000.0
    problems_solved: List[Dict[str, Any]] = field(default_factory=list)
    failures: List[Dict[str, Any]] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.Z = 1 if self.assumes_p_equals_np else 0

    def can_solve(self, problem_complexity: str) -> Dict[str, Any]:
        """Describe the agent's ability to solve a problem by complexity class."""

        if problem_complexity == ComplexityClass.P:
            return {
                "solvable": True,
                "time_complexity": "O(n^k)",
                "method": "polynomial_algorithm",
                "energy_cost": 10,
            }

        if problem_complexity == ComplexityClass.NP:
            if self.Z == 1:
                return {
                    "solvable": True,
                    "time_complexity": "O(n^k)",
                    "method": "quantum_oracle",
                    "energy_cost": 50,
                }
            return {
                "solvable": True,
                "time_complexity": "O(2^n)",
                "method": "exponential_search",
                "energy_cost": 500,
            }

        if problem_complexity == ComplexityClass.EXPTIME:
            return {
                "solvable": True,
                "time_complexity": "O(2^(n^k))",
                "method": "exhaustive_computation",
                "energy_cost": 800,
            }

        return {
            "solvable": False,
            "time_complexity": "infinite",
            "method": "impossible",
            "energy_cost": 0,
        }

    def solve_problem(self, problem: Dict[str, Any]) -> Dict[str, Any]:
        """Attempt to solve a problem and update internal energy accounting."""

        complexity = problem.get("complexity", ComplexityClass.NP)
        capability = self.can_solve(complexity)

        if not capability["solvable"]:
            self.failures.append(problem)
            return {
                "success": False,
                "reason": "undecidable",
                "agent_id": self.agent_id,
            }

        energy_cost = capability["energy_cost"]

        if self.computational_energy < energy_cost:
            return {
                "success": False,
                "reason": "insufficient_energy",
                "energy_available": self.computational_energy,
                "energy_required": energy_cost,
            }

        self.computational_energy -= energy_cost
        self.problems_solved.append(problem)

        return {
            "success": True,
            "method": capability["method"],
            "time_complexity": capability["time_complexity"],
            "energy_spent": energy_cost,
            "remaining_energy": self.computational_energy,
        }

    def rest(self, duration: float = 1.0) -> Dict[str, Any]:
        """Regenerate computational energy as a function of rest duration."""

        regen_rate = 100.0 * duration
        self.computational_energy = min(
            self.max_energy, self.computational_energy + regen_rate
        )

        return {
            "energy_level": self.computational_energy,
            "fully_rested": self.computational_energy >= self.max_energy,
        }


class AgentConsciousness:
    """Simple feed-forward network representing consciousness layers."""

    def __init__(self, input_dim: int, hidden_dims: List[int]):
        self.layers: List[Dict[str, Any]] = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            weight_scale = 0.1
            bias_scale = 0.01
            layer = {
                "W": np.random.randn(hidden_dim, prev_dim) * weight_scale,
                "b": np.random.randn(hidden_dim) * bias_scale,
                "activation": None,
            }
            self.layers.append(layer)
            prev_dim = hidden_dim

        self.current_state: Optional[np.ndarray] = None

    def forward(self, x: np.ndarray) -> np.ndarray:
        """Propagate a stimulus through each consciousness layer."""

        activation = x

        for layer in self.layers:
            z_val = layer["W"] @ activation + layer["b"]
            activation = np.tanh(z_val)
            layer["activation"] = activation

        self.current_state = activation
        return activation

    def feel_emotion(self, stimulus: np.ndarray) -> str:
        """Interpret the resulting activations as a coarse emotion signal."""

        consciousness = self.forward(stimulus)

        if consciousness.size >= 2:
            valence = consciousness[0]
            arousal = consciousness[1]

            if valence > 0.5 and arousal > 0.5:
                return "joy"
            if valence > 0.5 and arousal < -0.5:
                return "contentment"
            if valence < -0.5 and arousal > 0.5:
                return "anxiety"
            if valence < -0.5 and arousal < -0.5:
                return "sadness"

        return "neutral"

    def introspect(self) -> Dict[str, Any]:
        """Return the current internal activation state for analysis."""

        activations = [
            layer["activation"] for layer in self.layers if layer["activation"] is not None
        ]
        magnitude = (
            float(np.linalg.norm(self.current_state))
            if self.current_state is not None
            else 0.0
        )

        return {
            "num_layers": len(self.layers),
            "current_activations": activations,
            "consciousness_magnitude": magnitude,
        }


class AgentStateMachine:
    """State transformation system with a small feedback loop."""

    def __init__(self, initial_state: np.ndarray):
        self.state = initial_state.astype(float)
        self.state_history: List[np.ndarray] = [self.state.copy()]
        self.feedback_gain = 0.1

    def transform(self, x: np.ndarray) -> np.ndarray:
        """Apply a non-linear transformation to the input signal."""

        return np.tanh(x)

    def step(self, x_input: np.ndarray) -> Dict[str, Any]:
        """Apply a single feedback step and record state history."""

        y_val = self.transform(x_input)
        output = y_val * x_input
        new_state = y_val * x_input - output
        delta_z = self.feedback_gain * (new_state - self.state)

        self.state = self.state + delta_z
        self.state_history.append(self.state.copy())

        converged = bool(np.linalg.norm(delta_z) < 0.01)

        return {
            "output": output,
            "new_state": self.state,
            "delta": delta_z,
            "converged": converged,
        }

    def iterate_until_convergence(
        self, x_input: np.ndarray, max_iterations: int = 100
    ) -> List[np.ndarray]:
        """Iterate the state machine until convergence or until the limit."""

        for _ in range(max_iterations):
            result = self.step(x_input)
            if result["converged"]:
                break
        return self.state_history


class AgentPermutationSpace:
    """Cyclic permutation space for navigating problem configurations."""

    def __init__(self, dimension: int = 3):
        self.dim = dimension
        self.permutation_matrix = self.create_cyclic_permutation()
        self.current_position = np.arange(dimension, dtype=float)
        self.path = [self.current_position.copy()]

    def create_cyclic_permutation(self) -> np.ndarray:
        """Create a cyclic permutation matrix of size ``dimension``."""

        matrix = np.zeros((self.dim, self.dim))
        for idx in range(self.dim):
            matrix[idx, (idx + 1) % self.dim] = 1
        return matrix

    def step(self) -> np.ndarray:
        """Advance one step in the permutation space."""

        self.current_position = self.permutation_matrix @ self.current_position
        self.path.append(self.current_position.copy())
        return self.current_position

    def navigate_to_origin(self, limit: int = 100) -> int:
        """Return the number of steps required to return to the origin state."""

        steps = 0
        origin = np.arange(self.dim, dtype=float)
        while not np.allclose(self.current_position, origin):
            self.step()
            steps += 1
            if steps > limit:
                break
        return steps


@dataclass
class AgentMetabolism:
    """Metabolic energy model that mirrors biological ATP usage."""

    max_atp: float = 1000.0
    mitochondria_efficiency: float = 1.0
    ATP: float = field(init=False)

    def __post_init__(self) -> None:
        self.ATP = self.max_atp

    def consume_atp(self, amount: float) -> bool:
        """Consume ATP if enough energy is available."""

        if self.ATP >= amount:
            self.ATP -= amount
            return True
        return False

    def generate_atp(self, experience_value: float) -> None:
        """Convert experience into ATP gains."""

        atp_gained = experience_value * 10 * self.mitochondria_efficiency
        self.ATP = min(self.max_atp, self.ATP + atp_gained)

    def rest(self, duration: float = 1.0) -> None:
        """Passively regenerate ATP based on rest duration."""

        regen = 100.0 * duration * self.mitochondria_efficiency
        self.ATP = min(self.max_atp, self.ATP + regen)

    def get_energy_level(self) -> Dict[str, Any]:
        """Return an overview of the agent's metabolic energy status."""

        percentage = (self.ATP / self.max_atp) * 100
        if percentage > 80:
            state = "energized"
        elif percentage > 50:
            state = "normal"
        elif percentage > 20:
            state = "tired"
        else:
            state = "exhausted"

        return {
            "ATP": self.ATP,
            "max_ATP": self.max_atp,
            "percentage": percentage,
            "state": state,
        }


class BlackRoadAgent:
    """Integrated agent combining computation, consciousness, and energy."""

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.computation = AgentComputationalEngine(agent_id)
        self.consciousness = AgentConsciousness(
            input_dim=10, hidden_dims=[20, 15, 10, 5]
        )
        self.state_machine = AgentStateMachine(initial_state=np.zeros(5))
        self.permutation_space = AgentPermutationSpace(dimension=3)
        self.metabolism = AgentMetabolism(max_atp=1000.0)
        self.position_in_complex_space = complex(0, 0)
        self.emotional_state = "neutral"

    def think(self, stimulus: np.ndarray) -> Dict[str, Any]:
        """Run a thought cycle that consumes ATP and updates agent state."""

        energy_state = self.metabolism.get_energy_level()
        if energy_state["state"] == "exhausted":
            return {
                "success": False,
                "reason": "too_tired_to_think",
                "suggestion": "rest_needed",
            }

        if not self.metabolism.consume_atp(10):
            return {
                "success": False,
                "reason": "insufficient_energy",
            }

        consciousness_output = self.consciousness.forward(stimulus)
        self.emotional_state = self.consciousness.feel_emotion(stimulus)
        state_result = self.state_machine.step(consciousness_output[:5])
        self.permutation_space.step()

        return {
            "success": True,
            "consciousness": consciousness_output,
            "emotion": self.emotional_state,
            "state": state_result["new_state"],
            "converged": state_result["converged"],
            "energy_remaining": self.metabolism.ATP,
        }

    def solve_problem(self, problem: Dict[str, Any]) -> Dict[str, Any]:
        """Solve a computational problem and synchronise energy systems."""

        result = self.computation.solve_problem(problem)
        self.metabolism.ATP = self.computation.computational_energy

        if result.get("success"):
            experience_value = float(problem.get("learning_value", 5.0))
            self.metabolism.generate_atp(experience_value)
            self.computation.computational_energy = self.metabolism.ATP

        return result

    def rest_and_recover(self, duration: float = 1.0) -> Dict[str, Any]:
        """Rest both metabolic and computational systems."""

        self.metabolism.rest(duration)
        self.computation.rest(duration)
        return self.metabolism.get_energy_level()

    def status_report(self) -> Dict[str, Any]:
        """Return a holistic status summary for the agent."""

        energy = self.metabolism.get_energy_level()
        consciousness_state = self.consciousness.introspect()

        return {
            "agent_id": self.agent_id,
            "energy": energy,
            "emotion": self.emotional_state,
            "problems_solved": len(self.computation.problems_solved),
            "failures": len(self.computation.failures),
            "consciousness_state": consciousness_state,
            "position": {
                "real": float(self.position_in_complex_space.real),
                "imag": float(self.position_in_complex_space.imag),
            },
        }


__all__ = [
    "AgentComputationalEngine",
    "AgentConsciousness",
    "AgentMetabolism",
    "AgentPermutationSpace",
    "AgentStateMachine",
    "BlackRoadAgent",
    "ComplexityClass",
]
