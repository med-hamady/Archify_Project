#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys

# Set stdout to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

histo_dir = r'C:\Users\pc\Desktop\FAC GAME\pcem2\S INETR\quiz pcem2\histo'

print("📂 Analyse du dossier Histologie PCEM2\n")
print("=" * 60)

files = [f for f in os.listdir(histo_dir) if f.endswith('.txt')]
files_sorted = sorted(files)

print(f"\n📊 Nombre de fichiers: {len(files_sorted)}\n")

total_questions = 0

for i, filename in enumerate(files_sorted, 1):
    filepath = os.path.join(histo_dir, filename)

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Count QCM
        qcm_count = content.count('QCM ')
        total_questions += qcm_count

        # Get first 300 chars for preview
        preview = content[:300].replace('\n', ' ')

        print(f"{i}. {filename}")
        print(f"   Questions: {qcm_count}")
        print(f"   Aperçu: {preview}...")
        print()

    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        print()

print("=" * 60)
print(f"\n📊 Total questions: {total_questions}")
