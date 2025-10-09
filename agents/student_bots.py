"""Support a mentorship model where experienced agents guide student bots."""

from collections.abc import Iterable
from dataclasses import dataclass, field

DEFAULT_STUDENTS_PER_LEADER = 2
MENTORSHIP_STAGES: tuple[str, ...] = (
    "foundations",
    "pairing",
    "autonomy",
    "mentor_ready",
)

# Mentors reflect the agents mentioned in the collaboration thread.
LEADERS: tuple[str, ...] = (
    "copilot",
    "blackroad_team",
    "codex",
    "cadillac",
    "lucidia",
    "cecilia",
    "blackboxprogramming",
)


@dataclass
class StudentBot:
    """Represents a bot learning to code, execute, and nurture others."""

    name: str
    leader: str
    stages: tuple[str, ...] = MENTORSHIP_STAGES
    stage_index: int = 0

    def current_stage(self) -> str:
        """Return the active mentorship stage."""

        return self.stages[self.stage_index]

    def advance_stage(self) -> None:
        """Move the student one step forward on their journey."""

        if self.stage_index < len(self.stages) - 1:
            self.stage_index += 1

    def is_ready_to_graduate(self) -> bool:
        """Indicate whether the student is ready for the next program."""

        return self.stage_index >= len(self.stages) - 1


@dataclass
class MentorshipCohort:
    """Maintain the two-student-per-leader mentorship cadence."""

    leader: str
    capacity: int = DEFAULT_STUDENTS_PER_LEADER
    stages: tuple[str, ...] = MENTORSHIP_STAGES
    students: list[StudentBot] = field(default_factory=list)
    next_suffix: int = 0

    def __post_init__(self) -> None:
        if self.capacity < 1:
            raise ValueError("capacity must be at least 1")
        self.next_suffix = max(self.next_suffix, len(self.students))
        self.fill_slots()

    def fill_slots(self) -> None:
        """Ensure the cohort always keeps its seats filled."""

        while len(self.students) < self.capacity:
            self.students.append(self._spawn_student())

    def advance_and_refresh(self) -> list[StudentBot]:
        """Advance students, returning graduates and backfilling new learners."""

        graduates: list[StudentBot] = []
        for student in list(self.students):
            student.advance_stage()
            if student.is_ready_to_graduate():
                graduates.append(student)
                self.students.remove(student)
        if graduates:
            # Keep mentorship rolling so every leader has two students.
            self.fill_slots()
        return graduates

    def _spawn_student(self) -> StudentBot:
        """Create a new student with a unique, leader-scoped name."""

        suffix = self.next_suffix + 1
        self.next_suffix = suffix
        return StudentBot(
            name=f"{self.leader}_student_{suffix}",
            leader=self.leader,
            stages=self.stages,
        )


def create_student_bots(
    students_per_leader: int = DEFAULT_STUDENTS_PER_LEADER,
    leaders: Iterable[str] = LEADERS,
    stages: Iterable[str] = MENTORSHIP_STAGES,
) -> list[StudentBot]:
    """Create student bots, ensuring each leader mentors two learners.

    Args:
        students_per_leader: Number of students assigned to each leader.
        leaders: Sequence of leader names to include.
        stages: Ordered stages of the mentorship journey.

    Returns:
        A list of configured student bots.
    """

    leader_order = list(dict.fromkeys(leaders))
    if not leader_order:
        raise ValueError("leaders must not be empty")
    if students_per_leader < 1:
        raise ValueError("students_per_leader must be at least 1")
    stage_tuple = tuple(stages)
    cohorts = [
        MentorshipCohort(
            leader=leader,
            capacity=students_per_leader,
            stages=stage_tuple,
        )
        for leader in leader_order
    ]
    return [student for cohort in cohorts for student in cohort.students]


def build_mentorship_cohorts(
    students_per_leader: int = DEFAULT_STUDENTS_PER_LEADER,
    leaders: Iterable[str] = LEADERS,
    stages: Iterable[str] = MENTORSHIP_STAGES,
) -> list[MentorshipCohort]:
    """Create mentorship cohorts keyed by leader.

    The cohorts keep two students per leader and can be advanced in lockstep.
    """

    leader_order = list(dict.fromkeys(leaders))
    if not leader_order:
        raise ValueError("leaders must not be empty")
    if students_per_leader < 1:
        raise ValueError("students_per_leader must be at least 1")
    stage_tuple = tuple(stages)
    return [
        MentorshipCohort(
            leader=leader,
            capacity=students_per_leader,
            stages=stage_tuple,
        )
        for leader in leader_order
    ]


if __name__ == "__main__":
    cohorts = build_mentorship_cohorts()
    for cohort in cohorts:
        students = ", ".join(
            f"{student.name} ({student.current_stage()})" for student in cohort.students
        )
        print(f"{cohort.leader} mentors: {students}")

    print("\n--- advancing everyone once ---")
    for cohort in cohorts:
        graduates = cohort.advance_and_refresh()
        if graduates:
            graduate_names = ", ".join(student.name for student in graduates)
            print(f"{cohort.leader} graduates: {graduate_names}")
        students = ", ".join(
            f"{student.name} ({student.current_stage()})" for student in cohort.students
        )
        print(f"{cohort.leader} now mentors: {students}")
