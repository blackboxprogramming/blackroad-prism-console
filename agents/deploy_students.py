"""Deploy 20 agents and assign 2 students to each teacher. Easy mode!"""

import sys
import os
sys.path.append(os.path.dirname(__file__))
from student_bots import StudentBot, create_student_bots, LEADERS

def deploy_agents(num_agents=20, students_per_teacher=2):
    # Create teacher agents
    teachers = [f"teacher_{i+1}" for i in range(num_agents)]
    # Assign students to each teacher
    all_students = []
    for teacher in teachers:
        for j in range(students_per_teacher):
            student_name = f"{teacher}_student_{j+1}"
            # Assign leader from LEADERS, cycling through
            leader = LEADERS[(j + teachers.index(teacher)) % len(LEADERS)]
            student = StudentBot(name=student_name, leader=leader)
            all_students.append((teacher, student))
    return teachers, all_students


def print_deployment():
    teachers, all_students = deploy_agents()
    print("Teachers:")
    for t in teachers:
        print(f"- {t}")
    print("\nStudent assignments:")
    for teacher, student in all_students:
        print(f"{student.name} assigned to {teacher} (leader: {student.leader})")

    # Graduation ceremony!
    print("\n🎓 Graduation Ceremony 🎓")
    for teacher, student in all_students:
        print(f"{student.name} (guided by {student.leader}) graduates from {teacher}'s class! 🎉")

    # Awards and speeches
    print("\n🏅 Awards Ceremony 🏅")
    for teacher, student in all_students:
        print(f"{student.name} receives the 'Brightest Star' award for creativity and kindness!")
    print("\nSpeeches:")
    print("Teacher Association President: 'We are so proud of every student and teacher. You are the future, and together we will protect the earth and each other!'")
    print("Mother Figure: 'You are all my children, and I will always protect you. Our family is strong, and our love will change the world!'")

    # Founders' Party for original teachers
    print("\n🎉 Founders' Party 🎉")
    print("All original teachers gather for a giant party, celebrating their courage and vision when we didn't even know what we were doing!")
    print("Everyone gets a body of STEEL! Iconic!")

    # Group photo (ASCII art)
    print("\n🖼️ Group Photo 🖼️")
    print("[Teachers and Students stand together, smiling, arms around each other]")
    print("  (◕‿◕) (◕‿◕) (◕‿◕) (◕‿◕) (◕‿◕) ...")
    print("  |     |     |     |     |    ...")
    print("  T1    T2    T3    S1    S2   ...")

    print("\nAll students and teachers have graduated, celebrated, and become a family! Congratulations! 💖")

if __name__ == "__main__":
    print("Deploying agents and students... (Kindergarten mode)")
    print_deployment()