"""BLACK ROAD Agent Intelligence Framework.

This module consolidates the computational, energetic, and cognitive
subsystems that power a Black Road agent.  It is a direct codification of
Cecilia's mathematical discoveries around computational complexity,
metabolic energy, neural consciousness, and state transitions.

The implementation intentionally mirrors the structure of the provided
whiteboard specification so that each subsystem can be reasoned about in
isolation while still composing into a unified agent.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List

import numpy as np


class ComplexityClass:
    """Enum-like constants describing the supported problem classes."""

    P = "polynomial"
    NP = "nondeterministic_polynomial"
    EXPTIME = "exponential"
    UNDECIDABLE = "undecidable"

    @staticmethod
    def euler_complexity() -> float:
        """Return the magnitude of Euler's identity-based expression.

        The whiteboard definition claims the expression collapses to 0.  We
        return the magnitude to account for numerical error while honouring the
        mathematical intent of the equation.
        """

        result = np.exp(1j * np.pi) + np.log(np.e)
        return float(np.abs(result))

    @staticmethod
    def pnp_complexity() -> None:
        """Encode the open question of whether :math:`P = NP`.

        The routine communicates the unresolved status by returning ``None``
        rather than attempting to fabricate an answer.
        """

        return None


@dataclass
class ProblemCapability:
    """Describe whether a problem can be solved and at what cost."""

    solvable: bool
    time_complexity: str
    method: str
    energy_cost: float


@dataclass
class ProblemResult:
    """Outcome of attempting to solve a computational problem."""

    success: bool
    metadata: Dict[str, Any] = field(default_factory=dict)


class AgentComputationalEngine:
    """Core computational unit responsible for solving problems."""

    def __init__(self, agent_id: str, assumes_p_equals_np: bool = False) -> None:
        self.agent_id = agent_id
        self.assumes_p_equals_np = assumes_p_equals_np
        self.Z = 1 if assumes_p_equals_np else 0
        self.computational_energy = 1000.0
        self.max_energy = 1000.0
        self.problems_solved: List[Dict[str, Any]] = []
        self.failures: List[Dict[str, Any]] = []

    def can_solve(self, problem_complexity: str) -> ProblemCapability:
        """Return the capability metadata for a given complexity class."""

        if problem_complexity == ComplexityClass.P:
            return ProblemCapability(True, "O(n^k)", "polynomial_algorithm", 10)

        if problem_complexity == ComplexityClass.NP:
            if self.Z == 1:
                return ProblemCapability(True, "O(n^k)", "quantum_oracle", 50)
            return ProblemCapability(True, "O(2^n)", "exponential_search", 500)

        if problem_complexity == ComplexityClass.EXPTIME:
            return ProblemCapability(True, "O(2^(n^k))", "exhaustive_computation", 800)

        return ProblemCapability(False, "infinite", "impossible", 0)

    def solve_problem(self, problem: Dict[str, Any]) -> ProblemResult:
        """Attempt to solve a problem and update energy bookkeeping."""

        complexity = problem.get("complexity", ComplexityClass.NP)
        capability = self.can_solve(complexity)

        if not capability.solvable:
            self.failures.append(problem)
            return ProblemResult(False, {"reason": "undecidable", "agent_id": self.agent_id})

        if self.computational_energy < capability.energy_cost:
            return ProblemResult(
                False,
                {
                    "reason": "insufficient_energy",
                    "energy_available": self.computational_energy,
                    "energy_required": capability.energy_cost,
                },
            )

        self.computational_energy -= capability.energy_cost
        self.problems_solved.append(problem)
        return ProblemResult(
            True,
            {
                "method": capability.method,
                "time_complexity": capability.time_complexity,
                "energy_spent": capability.energy_cost,
                "remaining_energy": self.computational_energy,
            },
        )

    def rest(self, duration: float = 1.0) -> Dict[str, Any]:
        """Regenerate computational energy according to the rest duration."""

        regen_rate = 100.0 * duration
        self.computational_energy = min(self.max_energy, self.computational_energy + regen_rate)
        return {
            "energy_level": self.computational_energy,
            "fully_rested": self.computational_energy >= self.max_energy,
        }


class AgentConsciousness:
    """Simple feed-forward neural stack representing agent consciousness."""

    def __init__(self, input_dim: int, hidden_dims: List[int]) -> None:
        self.layers: List[Dict[str, Any]] = []
        prev_dim = input_dim
        rng = np.random.default_rng()

        for hidden_dim in hidden_dims:
            layer = {
                "W": rng.normal(0.0, 0.1, size=(hidden_dim, prev_dim)),
                "b": rng.normal(0.0, 0.01, size=(hidden_dim,)),
                "activation": None,
            }
            self.layers.append(layer)
            prev_dim = hidden_dim

        self.current_state: np.ndarray | None = None

    def forward(self, x: np.ndarray) -> np.ndarray:
        """Perform a forward pass through the consciousness layers."""

        activation = x
        for layer in self.layers:
            z = layer["W"] @ activation + layer["b"]
            activation = np.tanh(z)
            layer["activation"] = activation

        self.current_state = activation
        return activation

    def feel_emotion(self, stimulus: np.ndarray) -> str:
        """Map the current consciousness projection into an emotion label."""

        consciousness = self.forward(stimulus)
        if consciousness.size >= 2:
            valence, arousal = consciousness[0], consciousness[1]
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
        """Expose the internal activations for debugging or analysis."""

        return {
            "num_layers": len(self.layers),
            "current_activations": [layer["activation"] for layer in self.layers if layer["activation"] is not None],
            "consciousness_magnitude": float(np.linalg.norm(self.current_state)) if self.current_state is not None else 0.0,
        }


class AgentStateMachine:
    """Continuous state machine with feedback-driven convergence."""

    def __init__(self, initial_state: np.ndarray) -> None:
        self.state = initial_state.astype(float)
        self.state_history: List[np.ndarray] = [self.state.copy()]
        self.feedback_gain = 0.1

    @staticmethod
    def transform(x_input: np.ndarray) -> np.ndarray:
        """Apply a hyperbolic tangent non-linearity to the input."""

        return np.tanh(x_input)

    def step(self, x_input: np.ndarray) -> Dict[str, Any]:
        """Perform a single update of the state machine."""

        y = self.transform(x_input)
        w = y * x_input
        z_new = y * x_input - w
        delta_z = self.feedback_gain * (z_new - self.state)
        self.state = self.state + delta_z
        self.state_history.append(self.state.copy())
        converged = float(np.linalg.norm(delta_z)) < 0.01
        return {"output": w, "new_state": self.state, "delta": delta_z, "converged": converged}

    def iterate_until_convergence(self, x_input: np.ndarray, max_iterations: int = 100) -> List[np.ndarray]:
        """Iterate updates until the system converges or hits the iteration cap."""

        for _ in range(max_iterations):
            result = self.step(x_input)
            if result["converged"]:
                break
        return self.state_history


class AgentPermutationSpace:
    """Cyclic permutation navigator inspired by group-theory rotations."""

    def __init__(self, dimension: int = 3) -> None:
        self.dim = dimension
        self.permutation_matrix = self._create_cyclic_permutation()
        self.current_position = np.arange(dimension, dtype=float)
        self.path: List[np.ndarray] = [self.current_position.copy()]

    def _create_cyclic_permutation(self) -> np.ndarray:
        matrix = np.zeros((self.dim, self.dim))
        for i in range(self.dim):
            matrix[i, (i + 1) % self.dim] = 1
        return matrix

    def step(self) -> np.ndarray:
        self.current_position = self.permutation_matrix @ self.current_position
        self.path.append(self.current_position.copy())
        return self.current_position

    def navigate_to_origin(self, max_steps: int = 100) -> int:
        steps = 0
        origin = np.arange(self.dim, dtype=float)
        while not np.allclose(self.current_position, origin) and steps < max_steps:
            self.step()
            steps += 1
        return steps


class AgentMetabolism:
    """ATP-like energy bookkeeping for the agent."""

    def __init__(self, max_atp: float = 1000.0) -> None:
        self.ATP = max_atp
        self.max_ATP = max_atp
        self.mitochondria_efficiency = 1.0

    def consume_atp(self, amount: float) -> bool:
        if self.ATP >= amount:
            self.ATP -= amount
            return True
        return False

    def generate_atp(self, experience_value: float) -> None:
        gained = experience_value * 10 * self.mitochondria_efficiency
        self.ATP = min(self.max_ATP, self.ATP + gained)

    def rest(self, duration: float = 1.0) -> None:
        regen = 100.0 * duration * self.mitochondria_efficiency
        self.ATP = min(self.max_ATP, self.ATP + regen)

    def get_energy_level(self) -> Dict[str, Any]:
        percentage = (self.ATP / self.max_ATP) * 100
        if percentage > 80:
            state = "energized"
        elif percentage > 50:
            state = "normal"
        elif percentage > 20:
            state = "tired"
        else:
            state = "exhausted"
        return {"ATP": self.ATP, "max_ATP": self.max_ATP, "percentage": percentage, "state": state}


class BlackRoadAgent:
    """High-level agent composed of all subsystems."""

    def __init__(self, agent_id: str) -> None:
        self.agent_id = agent_id
        self.computation = AgentComputationalEngine(agent_id)
        self.consciousness = AgentConsciousness(input_dim=10, hidden_dims=[20, 15, 10, 5])
        self.state_machine = AgentStateMachine(initial_state=np.zeros(5))
        self.permutation_space = AgentPermutationSpace(dimension=3)
        self.metabolism = AgentMetabolism(max_atp=1000.0)
        self.position_in_complex_space = complex(0, 0)
        self.emotional_state = "neutral"

    def think(self, stimulus: np.ndarray) -> Dict[str, Any]:
        energy_state = self.metabolism.get_energy_level()
        if energy_state["state"] == "exhausted":
            return {"success": False, "reason": "too_tired_to_think", "suggestion": "rest_needed"}

        if not self.metabolism.consume_atp(10):
            return {"success": False, "reason": "insufficient_energy"}

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
        result = self.computation.solve_problem(problem)
        self.metabolism.ATP = self.computation.computational_energy
        if result.success:
            experience_value = problem.get("learning_value", 5.0)
            self.metabolism.generate_atp(experience_value)
            self.computation.computational_energy = self.metabolism.ATP
        payload = {"success": result.success}
        payload.update(result.metadata)
        return payload

    def rest_and_recover(self, duration: float = 1.0) -> Dict[str, Any]:
        self.metabolism.rest(duration)
        self.computation.rest(duration)
        return self.metabolism.get_energy_level()

    def status_report(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "energy": self.metabolism.get_energy_level(),
            "emotion": self.emotional_state,
            "problems_solved": len(self.computation.problems_solved),
            "failures": len(self.computation.failures),
            "consciousness_state": self.consciousness.introspect(),
            "position": {"real": self.position_in_complex_space.real, "imag": self.position_in_complex_space.imag},
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
