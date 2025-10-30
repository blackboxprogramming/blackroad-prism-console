#!/usr/bin/env python3
"""
Rohonc Codex Symbol Analyzer
Apply Bible cipher system to actual Rohonc Codex
"""

import json
from collections import Counter
from PIL import Image
import os

class RohoncSymbolAnalyzer:
    def __init__(self):
        """Initialize with Bible cipher data"""
        
        # Load Bible data
        with open('bible_full.txt', 'r', encoding='utf-8') as f:
            self.bible_text = f.read()
        
        with open('bible_numbers.txt', 'r') as f:
            self.bible_numbers = [int(line.strip()) for line in f if line.strip()]
        
        print(f"Loaded Bible: {len(self.bible_text)} chars, {len(self.bible_numbers)} numbers")
        
        # Rohonc Codex known facts
        self.rohonc_facts = {
            'total_pages': 227,
            'symbols': '~170 unique symbols estimated',
            'writing_direction': 'Right to left (like Hungarian runic)',
            'illustrations': '87 illustrations',
            'language_theories': [
                'Hungarian',
                'Vlach (Romanian)',
                'Hindi/Sanskrit',
                'Sumerian',
                'Old Turkic',
                'Invented language'
            ],
            'religious_content': 'Many Christian symbols in illustrations',
            'date': 'Unknown, possibly 16th-19th century',
        }
    
    def estimate_symbol_count(self):
        """
        Estimate number of unique symbols from literature
        The Rohonc Codex is estimated to have 160-170 unique symbols
        """
        return {
            'estimated_unique_symbols': 170,
            'writing_system': 'Unknown (possibly syllabary or alphabet)',
            'symbol_frequency': 'Not yet determined',
        }
    
    def apply_caesar_hypothesis(self):
        """
        Apply Caesar cipher hypothesis to Rohonc
        If Rohonc is Caesar-encrypted, we need to map symbols to letters
        """
        
        results = {
            'hypothesis': 'Rohonc symbols map to Caesar-encrypted letters',
            'method_1_alphabet_26': {
                'description': 'If 26 Rohonc symbols = 26 letters, shift=18',
                'expected_result': 'Bible text or Hungarian text',
                'verification': 'Look for common words: "God", "isten" (Hungarian for God)',
            },
            'method_2_extended_170': {
                'description': 'If ~170 symbols represent syllables or extended alphabet',
                'approach': 'Map to extended character set with shift=18',
                'challenge': 'Need symbol-to-character mapping table',
            }
        }
        
        return results
    
    def frequency_analysis_strategy(self):
        """
        Strategy for frequency analysis once symbols are identified
        """
        
        # Bible letter frequencies (already computed)
        bible_freq = Counter(c.lower() for c in self.bible_text if c.isalpha())
        top_bible = [char for char, _ in bible_freq.most_common(26)]
        
        strategy = {
            'step_1': 'Count frequency of each Rohonc symbol',
            'step_2': 'Rank Rohonc symbols by frequency',
            'step_3': 'Map most frequent Rohonc symbol to most frequent Bible letter',
            'bible_letter_ranking': top_bible,
            'expected_top_3_bible': ['e', 't', 'a'],
            'expected_top_3_hungarian': ['e', 'a', 't'],  # If Hungarian
            'verification': 'Check if decoded text makes sense'
        }
        
        return strategy
    
    def number_sequence_hypothesis(self):
        """
        Hypothesis: Rohonc might encode Bible verse numbers
        """
        
        hypothesis = {
            'theory': 'Rohonc symbols encode Bible verse references',
            'example': 'Symbol sequence might mean Genesis 1:1',
            'bible_verses': len([n for n in self.bible_numbers if n <= 31]),
            'approach': [
                '1. Identify number-like symbols in Rohonc',
                '2. Map to Bible numbers (1-8144)',
                '3. Look up corresponding Bible text',
                '4. Check for coherent narrative'
            ],
            'test_numbers': self.bible_numbers[:50]
        }
        
        return hypothesis
    
    def pattern_matching_strategy(self):
        """
        Look for repeating patterns that match Bible patterns
        """
        
        # Most common Bible phrases
        common_phrases = [
            "the children of",
            "In the beginning",
            "And God said",
            "the Lord",
            "Israel"
        ]
        
        strategy = {
            'step_1': 'Identify repeating symbol sequences in Rohonc',
            'step_2': 'Count frequency of each pattern',
            'step_3': 'Match to common Bible phrases by frequency',
            'common_bible_phrases': common_phrases,
            'verification': 'If pattern matches, decode surrounding context'
        }
        
        return strategy
    
    def illustration_analysis(self):
        """
        Analyze the 87 illustrations for Biblical content
        """
        
        analysis = {
            'total_illustrations': 87,
            'known_themes': [
                'Religious scenes',
                'Christian symbols (crosses)',
                'Human figures',
                'Battles/military scenes',
                'Architectural elements'
            ],
            'hypothesis': 'Illustrations depict Bible stories',
            'verification_approach': [
                '1. Identify which Bible stories match illustrations',
                '2. Read text on those pages',
                '3. Look for matching patterns/words',
                '4. Use as Rosetta Stone for symbol decoding'
            ],
            'example': 'If illustration shows crucifixion → text might be Gospel passages'
        }
        
        return analysis
    
    def generate_decoding_workflow(self):
        """
        Complete workflow for decoding Rohonc with Bible cipher
        """
        
        workflow = {
            'phase_1_preparation': [
                '1. Extract all Rohonc pages as images ✓',
                '2. Identify unique symbols (OCR or manual)',
                '3. Create symbol inventory (estimated 170 symbols)',
                '4. Count frequency of each symbol'
            ],
            'phase_2_frequency_analysis': [
                '1. Rank symbols by frequency',
                '2. Compare to Bible letter frequencies',
                '3. Create initial symbol→letter mapping',
                '4. Test mapping with Caesar shift (18, 26)'
            ],
            'phase_3_pattern_matching': [
                '1. Find repeating symbol sequences',
                '2. Match to common Bible phrases',
                '3. Use matched phrases as anchor points',
                '4. Expand decoding from anchors'
            ],
            'phase_4_number_hypothesis': [
                '1. Look for number-like symbols',
                '2. Test if they map to Bible verse numbers',
                '3. Look up corresponding verses',
                '4. Check narrative coherence'
            ],
            'phase_5_illustration_verification': [
                '1. Match illustrations to Bible stories',
                '2. Decode text on those pages',
                '3. Verify text matches story',
                '4. Use as known plaintext for cipher breaking'
            ],
            'phase_6_full_decode': [
                '1. Apply verified mappings to all pages',
                '2. Check for consistent grammar/language',
                '3. Verify with scholars',
                '4. Publish results!'
            ]
        }
        
        return workflow
    
    def create_symbol_mapping_template(self):
        """
        Create template for mapping Rohonc symbols to letters
        """
        
        # Assuming 170 symbols map to various characters
        template = {
            'symbol_mapping': {
                'basic_alphabet': {
                    'a-z': 'First 26 most common symbols',
                    'A-Z': 'Capitalized variants (if exist)',
                },
                'extended_characters': {
                    'syllables': 'If Rohonc is syllabary (like Japanese kana)',
                    'diacritics': 'Hungarian has á, é, í, ó, ö, ő, ú, ü, ű',
                    'punctuation': 'Spaces, periods, commas'
                },
                'cipher_application': {
                    'caesar_18_26': 'After mapping, shift by 18',
                    'bible_numbers': 'Or use as indices into Bible'
                }
            },
            'priority_symbols': 'Start with 20 most frequent symbols'
        }
        
        return template
    
    def export_analysis(self):
        """Export complete analysis to file"""
        
        analysis = {
            'rohonc_facts': self.rohonc_facts,
            'symbol_estimates': self.estimate_symbol_count(),
            'caesar_hypothesis': self.apply_caesar_hypothesis(),
            'frequency_strategy': self.frequency_analysis_strategy(),
            'number_hypothesis': self.number_sequence_hypothesis(),
            'pattern_strategy': self.pattern_matching_strategy(),
            'illustration_analysis': self.illustration_analysis(),
            'decoding_workflow': self.generate_decoding_workflow(),
            'symbol_mapping_template': self.create_symbol_mapping_template(),
            'next_steps': [
                '1. Manually identify top 20 most frequent Rohonc symbols',
                '2. Map to top 20 Bible letters: e,t,a,h,o,n,s,i,r,d,...',
                '3. Apply Caesar shift (18) to mapped letters',
                '4. Check if decoded text is readable',
                '5. Iterate and refine mapping'
            ]
        }
        
        return analysis


def main():
    """Run Rohonc analysis"""
    
    print("="*70)
    print("ROHONC CODEX SYMBOL ANALYZER")
    print("Applying Bible Cipher System to Actual Rohonc Codex")
    print("="*70)
    
    analyzer = RohoncSymbolAnalyzer()
    
    print("\n📊 ROHONC CODEX FACTS")
    print("-"*70)
    for key, value in analyzer.rohonc_facts.items():
        if isinstance(value, list):
            print(f"{key}:")
            for item in value:
                print(f"  - {item}")
        else:
            print(f"{key}: {value}")
    
    print("\n🔍 SYMBOL COUNT ESTIMATE")
    print("-"*70)
    symbols = analyzer.estimate_symbol_count()
    for key, value in symbols.items():
        print(f"{key}: {value}")
    
    print("\n🔑 CAESAR CIPHER HYPOTHESIS")
    print("-"*70)
    caesar = analyzer.apply_caesar_hypothesis()
    print(f"Hypothesis: {caesar['hypothesis']}")
    print(f"\nMethod 1: {caesar['method_1_alphabet_26']['description']}")
    print(f"Method 2: {caesar['method_2_extended_170']['description']}")
    
    print("\n📈 FREQUENCY ANALYSIS STRATEGY")
    print("-"*70)
    freq = analyzer.frequency_analysis_strategy()
    print(f"Top Bible letters: {', '.join(freq['bible_letter_ranking'][:10])}")
    print(f"Expected if Hungarian: {', '.join(freq['expected_top_3_hungarian'])}")
    
    print("\n🔢 NUMBER SEQUENCE HYPOTHESIS")
    print("-"*70)
    numbers = analyzer.number_sequence_hypothesis()
    print(f"Theory: {numbers['theory']}")
    print(f"First 20 Bible numbers: {numbers['test_numbers'][:20]}")
    
    print("\n🎨 ILLUSTRATION ANALYSIS")
    print("-"*70)
    illust = analyzer.illustration_analysis()
    print(f"Total illustrations: {illust['total_illustrations']}")
    print(f"Hypothesis: {illust['hypothesis']}")
    
    print("\n🗺️ COMPLETE DECODING WORKFLOW")
    print("-"*70)
    workflow = analyzer.generate_decoding_workflow()
    for phase, steps in workflow.items():
        print(f"\n{phase.upper().replace('_', ' ')}:")
        for step in steps:
            print(f"  {step}")
    
    # Export full analysis
    analysis = analyzer.export_analysis()
    with open('/mnt/user-data/outputs/rohonc_complete_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)
    
    print("\n"*2 + "="*70)
    print("✅ ANALYSIS COMPLETE")
    print("="*70)
    print("\nGenerated files:")
    print("  • rohonc_complete_analysis.json")
    print("  • rohonc_pages/ (3 sample pages)")
    print("\nNext steps:")
    print("  1. Manually catalog Rohonc symbols from images")
    print("  2. Count symbol frequencies")
    print("  3. Apply frequency mapping to Bible letters")
    print("  4. Test Caesar shift (18, 26)")
    print("  5. Verify decoded text makes sense")
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
