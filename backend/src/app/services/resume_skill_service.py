class ResumeSkillService:
    KNOWN_SKILLS = {
        "python": "Languages",
        "java": "Languages",
        "c++": "Languages",
        "javascript": "Languages",
        "typescript": "Languages",
        "sql": "Databases",
        "mysql": "Databases",
        "postgresql": "Databases",
        "fastapi": "Frameworks",
        "flask": "Frameworks",
        "django": "Frameworks",
        "react": "Frameworks",
        "docker": "Tools",
        "git": "Tools",
        "aws": "Cloud",
    }

    @staticmethod
    def extract_skills(parsed_text: str) -> list[dict[str, str | None]]:
        normalized_text = parsed_text.lower()
        found_skills: list[dict[str, str | None]] = []
        seen: set[str] = set()

        for skill_name, category in ResumeSkillService.KNOWN_SKILLS.items():
            if skill_name in normalized_text and skill_name not in seen:
                found_skills.append(
                    {
                        "skill_name": skill_name,
                        "category": category,
                    }
                )
                seen.add(skill_name)

        return found_skills

    @staticmethod
    def extract_unique_skill_names(parsed_text: str) -> list[str]:
        skills = ResumeSkillService.extract_skills(parsed_text)
        return [skill["skill_name"] for skill in skills if skill["skill_name"]]