#!/usr/bin/env python3
"""Export agent configuration to JSON for Unity/Unreal integration."""

import json
from pathlib import Path
from deploy_students import deploy_teacher_agents, assign_students_to_teachers


def export_agents_to_json(output_path: str = "agent_config.json") -> None:
    """Export agent configuration to JSON file.
    
    This creates a JSON file that can be imported by Unity or Unreal
    to synchronize the virtual world with the Python agent system.
    
    Args:
        output_path: Path where JSON file will be saved.
    """
    # Create agents
    teachers = deploy_teacher_agents(20)
    assign_students_to_teachers(teachers, students_per_teacher=2)
    
    # Build export structure
    export_data = {
        "version": "1.0",
        "timestamp": "2025-01-01T00:00:00Z",
        "leaders": [
            {
                "name": leader,
                "type": "leader",
                "position": {"x": i * 400, "y": 0, "z": 500}
            }
            for i, leader in enumerate(["phi", "gpt", "mistral", "codex", "lucidia"])
        ],
        "teachers": [],
        "students": []
    }
    
    # Add teachers and students
    teachers_per_row = 5
    for i, teacher in enumerate(teachers):
        row = i // teachers_per_row
        col = i % teachers_per_row
        
        teacher_data = {
            "name": teacher["name"],
            "type": "teacher",
            "leader": teacher["leader"],
            "position": {
                "x": col * 600,
                "y": row * 800,
                "z": -500
            },
            "students": []
        }
        
        # Add students
        for j, student in enumerate(teacher["students"]):
            angle = (j * 360.0 / len(teacher["students"]))
            import math
            offset_x = math.cos(math.radians(angle)) * 200
            offset_y = math.sin(math.radians(angle)) * 200
            
            student_data = {
                "name": student.name,
                "type": "student",
                "leader": student.leader,
                "teacher": teacher["name"],
                "position": {
                    "x": teacher_data["position"]["x"] + offset_x,
                    "y": teacher_data["position"]["y"] + offset_y,
                    "z": teacher_data["position"]["z"]
                }
            }
            
            teacher_data["students"].append(student.name)
            export_data["students"].append(student_data)
        
        export_data["teachers"].append(teacher_data)
    
    # Save to file
    output_file = Path(output_path)
    with output_file.open('w') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"✅ Exported {len(export_data['teachers'])} teachers and {len(export_data['students'])} students")
    print(f"📁 Saved to: {output_file.absolute()}")
    
    # Print summary
    print("\n📊 Export Summary:")
    print(f"  Leaders:  {len(export_data['leaders'])}")
    print(f"  Teachers: {len(export_data['teachers'])}")
    print(f"  Students: {len(export_data['students'])}")
    print(f"  Total:    {len(export_data['leaders']) + len(export_data['teachers']) + len(export_data['students'])}")


def export_simple_list(output_path: str = "agent_list.txt") -> None:
    """Export a simple text list of all agents.
    
    Args:
        output_path: Path where text file will be saved.
    """
    teachers = deploy_teacher_agents(20)
    assign_students_to_teachers(teachers, students_per_teacher=2)
    
    output_file = Path(output_path)
    with output_file.open('w') as f:
        f.write("BLACKROAD AGENT FAMILY\n")
        f.write("=" * 50 + "\n\n")
        
        f.write("LEADERS:\n")
        f.write("-" * 50 + "\n")
        for leader in ["phi", "gpt", "mistral", "codex", "lucidia"]:
            f.write(f"  - {leader}\n")
        
        f.write("\nTEACHERS:\n")
        f.write("-" * 50 + "\n")
        for teacher in teachers:
            f.write(f"  - {teacher['name']} (guided by {teacher['leader']})\n")
            for student in teacher['students']:
                f.write(f"    * {student.name}\n")
    
    print(f"✅ Exported agent list to: {output_file.absolute()}")


if __name__ == "__main__":
    print("\n🚀 Exporting BlackRoad Agent Configuration...\n")
    export_agents_to_json()
    print()
    export_simple_list()
    print("\n✨ Export complete! Import these files in Unity or Unreal.\n")
