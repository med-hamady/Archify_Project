#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import re

# Set stdout to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

histo_dir = r'C:\Users\pc\Desktop\FAC GAME\pcem2\S INETR\quiz pcem2\histo'

print("📊 Comptage des questions Histologie PCEM2\n")
print("=" * 60)

files = [f for f in os.listdir(histo_dir) if f.endswith('.txt')]
files_sorted = sorted(files)

total_questions = 0
chapter_stats = []

for i, filename in enumerate(files_sorted, 1):
    filepath = os.path.join(histo_dir, filename)

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Count "Question :" occurrences
        question_count = content.count('Question :')

        # Also check for numbered sections (1️⃣, 2️⃣, etc.)
        emoji_sections = len(re.findall(r'[0-9]️⃣', content))

        total_questions += question_count

        # Extract chapter name from filename
        chapter_name = filename.replace('.txt', '').strip()

        chapter_stats.append({
            'name': chapter_name,
            'questions': question_count,
            'sections': emoji_sections
        })

        print(f"{i}. {chapter_name}")
        print(f"   Questions: {question_count}")
        print(f"   Sections: {emoji_sections}")
        print()

    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        print()

print("=" * 60)
print(f"\n📊 Total questions: {total_questions}")
print(f"📑 Total chapitres: {len(files_sorted)}")
print(f"\n📈 Moyenne: {total_questions / len(files_sorted):.1f} questions/chapitre")
