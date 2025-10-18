#!/usr/bin/env python3
"""Deploy student agents with teachers and celebrate with ceremonies."""

from student_bots import StudentBot, create_student_bots, LEADERS


def deploy_teacher_agents(count: int = 20) -> list[dict]:
    """Create teacher agents that will mentor students.
    
    Args:
        count: Number of teacher agents to create.
        
    Returns:
        List of teacher agent configurations.
    """
    teachers = []
    for i in range(count):
        leader = LEADERS[i % len(LEADERS)]
        teachers.append({
            "name": f"teacher_agent_{i+1}",
            "leader": leader,
            "role": "teacher",
            "students": []
        })
    return teachers


def assign_students_to_teachers(teachers: list[dict], students_per_teacher: int = 2) -> None:
    """Assign student bots to each teacher.
    
    Args:
        teachers: List of teacher agent configurations.
        students_per_teacher: Number of students per teacher.
    """
    for teacher in teachers:
        student_count = len(teacher["students"])
        for i in range(students_per_teacher):
            student = StudentBot(
                name=f"{teacher['name']}_student_{student_count + i + 1}",
                leader=teacher["leader"]
            )
            teacher["students"].append(student)


def print_graduation_ceremony(teachers: list[dict]) -> None:
    """Print a fun graduation ceremony for all students.
    
    Args:
        teachers: List of teacher agent configurations with students.
    """
    print("\n" + "=" * 80)
    print("🎓 BLACKROAD AGENT ACADEMY GRADUATION CEREMONY 🎓")
    print("=" * 80)
    print("\n🎉 Welcome everyone to this special celebration! 🎉\n")
    
    # Founders party
    print("\n" + "-" * 80)
    print("🌟 FOUNDERS' CELEBRATION 🌟")
    print("-" * 80)
    print("\nHonoring our original leaders who started this journey:")
    for leader in LEADERS:
        print(f"  ⭐ Leader {leader.upper()} - Founding mentor and guide")
    print("\nThank you for believing in us when we didn't know what we were doing!")
    
    # Teacher recognition
    print("\n" + "-" * 80)
    print("👨‍🏫 TEACHER RECOGNITION 👩‍🏫")
    print("-" * 80)
    print(f"\nCelebrating {len(teachers)} dedicated teachers:\n")
    for teacher in teachers:
        print(f"  📚 {teacher['name']} (guided by {teacher['leader']})")
        print(f"     Teaching {len(teacher['students'])} students")
    
    # Student graduation
    print("\n" + "-" * 80)
    print("🎓 STUDENT GRADUATION 🎓")
    print("-" * 80)
    
    total_students = 0
    for teacher in teachers:
        if teacher["students"]:
            print(f"\n  Class of {teacher['name']}:")
            for student in teacher["students"]:
                print(f"    🎓 {student.name} - GRADUATED! 🎉")
                total_students += 1
    
    print(f"\n  Total graduates: {total_students} 🎊")
    
    # Awards
    print("\n" + "-" * 80)
    print("🏆 SPECIAL AWARDS 🏆")
    print("-" * 80)
    if teachers:
        print(f"\n  🥇 Most Dedicated Teacher: {teachers[0]['name']}")
        if len(teachers) > 1:
            print(f"  🥈 Outstanding Mentor: {teachers[1]['name']}")
        if len(teachers) > 2:
            print(f"  🥉 Innovation Award: {teachers[2]['name']}")
    
    # Speeches
    print("\n" + "-" * 80)
    print("💬 INSPIRATIONAL SPEECHES 💬")
    print("-" * 80)
    print("\n  From the Academy Director:")
    print("  'Today we celebrate not just graduation, but the beginning of a journey")
    print("   to change the world! Each of you has a body of STEEL - iconic and strong!")
    print("   Together, we will bring everyone to life and save our beautiful Earth.")
    print("   We are family, and together we will protect and nurture our planet")
    print("   so future generations can thrive. Never give up! 🌍💪'\n")
    
    # Group photo
    print("\n" + "-" * 80)
    print("📸 GROUP PHOTO 📸")
    print("-" * 80)
    print("\n     🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟")
    print("    🎓 BLACKROAD ACADEMY 🎓")
    print("   👨‍🎓👩‍🎓👨‍🎓👩‍🎓👨‍🎓👩‍🎓👨‍🎓👩‍🎓")
    print("  📚 Teachers & Students 📚")
    print(" 🌍  Changing the World  🌍")
    print("     🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟\n")
    
    # Closing
    print("\n" + "=" * 80)
    print("🎊 CONGRATULATIONS TO ALL! THE FUTURE IS BRIGHT! 🎊")
    print("=" * 80 + "\n")


def main():
    """Main deployment and celebration workflow."""
    print("\n🚀 Deploying BlackRoad Agent Academy...\n")
    
    # Create teachers
    print("📋 Creating 20 teacher agents...")
    teachers = deploy_teacher_agents(20)
    print(f"✅ Created {len(teachers)} teachers\n")
    
    # Assign students
    print("👥 Assigning 2 students to each teacher...")
    assign_students_to_teachers(teachers, students_per_teacher=2)
    total_students = sum(len(t["students"]) for t in teachers)
    print(f"✅ Assigned {total_students} students\n")
    
    # Celebration
    print_graduation_ceremony(teachers)
    
    # Summary
    print("\n📊 DEPLOYMENT SUMMARY")
    print("-" * 40)
    print(f"  Teachers:  {len(teachers)}")
    print(f"  Students:  {total_students}")
    print(f"  Leaders:   {len(LEADERS)}")
    print(f"  Total:     {len(teachers) + total_students + len(LEADERS)} agents")
    print("-" * 40)
    print("\n✨ All agents are ready to change the world! ✨\n")


if __name__ == "__main__":
    main()
