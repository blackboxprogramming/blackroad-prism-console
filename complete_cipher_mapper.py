#!/usr/bin/env python3
"""
Complete Bible Cipher Mapping System
Generates all possible cipher interpretations for Rohonc Codex
"""

import json
from collections import defaultdict, Counter

class CompleteCipherMapper:
    def __init__(self):
        """Initialize mapper with all Bible data"""
        
        # Load Bible text
        with open('bible_full.txt', 'r', encoding='utf-8') as f:
            self.bible = f.read()
        
        # Load Bible numbers
        with open('bible_numbers.txt', 'r') as f:
            self.numbers = [int(line.strip()) for line in f if line.strip()]
        
        print(f"Loaded Bible: {len(self.bible)} chars, {len(self.numbers)} numbers")
        
        # Build all mappings
        self.build_all_mappings()
    
    def build_all_mappings(self):
        """Build every possible cipher mapping"""
        
        print("\nBuilding cipher mappings...")
        
        # 1. Number to Character mapping (position-based)
        self.num_to_char = {}
        for i, num in enumerate(self.numbers):
            if num < len(self.bible):
                self.num_to_char[num] = self.bible[num]
        
        # 2. Position to Character (direct indexing)
        self.pos_to_char = {i: c for i, c in enumerate(self.bible)}
        
        # 3. Character to Position(s) (reverse lookup)
        self.char_to_pos = defaultdict(list)
        for i, c in enumerate(self.bible):
            if c.isalpha():
                self.char_to_pos[c.lower()].append(i)
        
        # 4. Character frequency ranking
        char_freq = Counter(c.lower() for c in self.bible if c.isalpha())
        self.char_freq_rank = {
            char: rank 
            for rank, (char, _) in enumerate(char_freq.most_common(), 1)
        }
        
        # 5. Number frequency ranking
        num_freq = Counter(self.numbers)
        self.num_freq_rank = {
            num: rank 
            for rank, (num, _) in enumerate(num_freq.most_common(), 1)
        }
        
        # 6. Caesar shift tables (all shifts)
        self.caesar_tables = {}
        for shift in range(26):
            self.caesar_tables[shift] = self.build_caesar_table(shift)
        
        # 7. Extended ASCII Caesar tables (256)
        self.caesar_256_tables = {}
        for shift in [18, 26]:  # Focus on specified shifts
            self.caesar_256_tables[shift] = self.build_caesar_256_table(shift)
        
        print(f"Built {len(self.num_to_char)} number-to-character mappings")
        print(f"Built {len(self.char_to_pos)} character-to-position mappings")
        print(f"Built {len(self.caesar_tables)} Caesar tables")
    
    def build_caesar_table(self, shift):
        """Build Caesar cipher table for given shift"""
        table = {}
        for i in range(26):
            plain = chr(ord('a') + i)
            cipher = chr(ord('a') + (i + shift) % 26)
            table[plain] = cipher
            table[plain.upper()] = cipher.upper()
        return table
    
    def build_caesar_256_table(self, shift):
        """Build extended ASCII Caesar cipher table"""
        return {i: (i + shift) % 256 for i in range(256)}
    
    def generate_substitution_alphabets(self):
        """Generate potential substitution alphabets from Bible"""
        
        # Method 1: Use first occurrence of each letter
        first_occurrence = {}
        for i, char in enumerate(self.bible.lower()):
            if char.isalpha() and char not in first_occurrence:
                first_occurrence[char] = i
        
        # Sort by position
        alphabet_by_position = ''.join(sorted(first_occurrence.keys(), 
                                             key=lambda x: first_occurrence[x]))
        
        # Method 2: Use frequency order
        char_freq = Counter(c.lower() for c in self.bible if c.isalpha())
        alphabet_by_frequency = ''.join([c for c, _ in char_freq.most_common()])
        
        # Method 3: Use numbers as indices to extract alphabet
        alphabet_by_numbers = ''
        seen = set()
        for num in self.numbers[:100]:
            if num < len(self.bible):
                char = self.bible[num].lower()
                if char.isalpha() and char not in seen:
                    alphabet_by_numbers += char
                    seen.add(char)
        
        return {
            'by_position': alphabet_by_position,
            'by_frequency': alphabet_by_frequency,
            'by_numbers': alphabet_by_numbers,
            'standard': 'abcdefghijklmnopqrstuvwxyz'
        }
    
    def create_polyalphabetic_key(self, length=100):
        """Create polyalphabetic cipher key from Bible numbers"""
        
        keys = {
            'direct_numbers': self.numbers[:length],
            'modulo_26': [n % 26 for n in self.numbers[:length]],
            'modulo_256': [n % 256 for n in self.numbers[:length]],
            'differences': [
                self.numbers[i+1] - self.numbers[i] 
                for i in range(min(length-1, len(self.numbers)-1))
            ],
            'cumulative': []
        }
        
        # Cumulative sum
        cumsum = 0
        for n in self.numbers[:length]:
            cumsum += n
            keys['cumulative'].append(cumsum % 26)
        
        return keys
    
    def extract_word_substitution_table(self):
        """Extract most common words for substitution cipher"""
        
        words = [w.lower() for w in self.bible.split() if w.isalpha()]
        word_freq = Counter(words)
        
        # Get top 100 words
        common_words = [w for w, _ in word_freq.most_common(100)]
        
        # Group by length
        by_length = defaultdict(list)
        for word in common_words:
            by_length[len(word)].append(word)
        
        return {
            'all': common_words,
            'by_length': dict(by_length),
            'two_letter': by_length[2][:20] if 2 in by_length else [],
            'three_letter': by_length[3][:20] if 3 in by_length else [],
        }
    
    def create_number_grid(self, rows=26, cols=26):
        """Create 26x26 grid of Bible numbers for matrix cipher"""
        
        grid = []
        idx = 0
        for i in range(rows):
            row = []
            for j in range(cols):
                if idx < len(self.numbers):
                    row.append(self.numbers[idx])
                    idx += 1
                else:
                    row.append(0)
            grid.append(row)
        
        return grid
    
    def generate_all_shift_variations(self, test_text="ABCDEFGHIJ"):
        """Generate text encrypted with all possible shifts"""
        
        results = {}
        
        # Standard alphabet (26)
        for shift in range(26):
            encrypted = ''
            for char in test_text:
                if char.isalpha():
                    base = ord('A') if char.isupper() else ord('a')
                    encrypted += chr((ord(char) - base + shift) % 26 + base)
                else:
                    encrypted += char
            results[f'shift_{shift}_alpha26'] = encrypted
        
        # Extended ASCII (256) - key shifts
        for shift in [18, 26]:
            encrypted = ''
            for char in test_text:
                encrypted += chr((ord(char) + shift) % 256)
            results[f'shift_{shift}_ascii256'] = repr(encrypted)
        
        return results
    
    def export_all_mappings(self):
        """Export all cipher mappings to files"""
        
        print("\nExporting cipher mappings...")
        
        # 1. Number to Character mapping
        with open('mapping_num_to_char.json', 'w') as f:
            json.dump(
                {str(k): v for k, v in self.num_to_char.items() if v.isprintable()},
                f, indent=2
            )
        
        # 2. Character frequency rankings
        with open('mapping_char_frequency.json', 'w') as f:
            json.dump(self.char_freq_rank, f, indent=2)
        
        # 3. Substitution alphabets
        alphabets = self.generate_substitution_alphabets()
        with open('substitution_alphabets.json', 'w') as f:
            json.dump(alphabets, f, indent=2)
        
        # 4. Polyalphabetic keys
        poly_keys = self.create_polyalphabetic_key(100)
        with open('polyalphabetic_keys.json', 'w') as f:
            json.dump(poly_keys, f, indent=2)
        
        # 5. Word substitution table
        word_table = self.extract_word_substitution_table()
        with open('word_substitution_table.json', 'w') as f:
            json.dump(word_table, f, indent=2)
        
        # 6. Caesar tables
        caesar_export = {
            f'shift_{k}': {
                chr(ord('a')+i): v 
                for i in range(26) 
                if chr(ord('a')+i) in v
            }
            for k, v in list(self.caesar_tables.items())[:5]  # First 5 shifts
        }
        with open('caesar_tables.json', 'w') as f:
            json.dump(caesar_export, f, indent=2)
        
        # 7. Number grid
        grid = self.create_number_grid(26, 26)
        with open('number_grid_26x26.json', 'w') as f:
            json.dump(grid, f, indent=2)
        
        # 8. All shift variations
        shifts = self.generate_all_shift_variations()
        with open('all_shift_variations.json', 'w') as f:
            json.dump(shifts, f, indent=2)
        
        print("Exported 8 mapping files")
    
    def create_master_cipher_document(self):
        """Create master document with all cipher information"""
        
        doc = {
            'metadata': {
                'bible_length': len(self.bible),
                'number_count': len(self.numbers),
                'unique_numbers': len(set(self.numbers)),
                'unique_chars': len(set(self.bible.lower())),
            },
            'cipher_keys': {
                'caesar_shift_18_26': 'Standard alphabet, shift by 18',
                'caesar_shift_18_256': 'Extended ASCII, shift by 18',
                'caesar_shift_26_256': 'Extended ASCII, shift by 26',
                'polyalphabetic': 'Use Bible numbers as variable shift key',
                'substitution': 'Replace with Bible characters at number positions',
                'position_based': 'Use Bible numbers as direct text positions',
            },
            'number_statistics': {
                'min': min(self.numbers),
                'max': max(self.numbers),
                'mean': sum(self.numbers) / len(self.numbers),
                'most_common': Counter(self.numbers).most_common(20),
            },
            'character_statistics': {
                'most_common_letters': [
                    (c, count) 
                    for c, count in Counter(
                        c.lower() for c in self.bible if c.isalpha()
                    ).most_common(26)
                ],
            },
            'recommended_decoding_strategies': [
                '1. Try Caesar shift with key=18 on alphabet (26 chars)',
                '2. Try Caesar shift with key=18 on ASCII (256 chars)',
                '3. Use Bible numbers as polyalphabetic key (Vigenère-style)',
                '4. Map Rohonc symbols to Bible chars by frequency',
                '5. Use Bible numbers as direct position indices',
                '6. Try number sequences as chapter:verse:word coordinates',
                '7. Look for repeating patterns matching Bible patterns',
                '8. Use word-level substitution with common Bible words',
            ],
            'example_decodings': {}
        }
        
        # Add example decodings
        test_strings = [
            "HELLO",
            "ROHONC",
            "BIBLE",
            "GENESIS"
        ]
        
        for test in test_strings:
            doc['example_decodings'][test] = {
                'caesar_18_26': self.apply_caesar(test, 18, 26),
                'caesar_18_256': repr(self.apply_caesar(test, 18, 256)),
            }
        
        with open('MASTER_CIPHER_GUIDE.json', 'w') as f:
            json.dump(doc, f, indent=2)
        
        print("\nCreated MASTER_CIPHER_GUIDE.json")
        
        return doc
    
    def apply_caesar(self, text, shift, base):
        """Apply Caesar cipher with given shift and base"""
        result = ''
        for char in text:
            if base == 26 and char.isalpha():
                if char.isupper():
                    result += chr((ord(char) - ord('A') + shift) % 26 + ord('A'))
                else:
                    result += chr((ord(char) - ord('a') + shift) % 26 + ord('a'))
            elif base == 256:
                result += chr((ord(char) + shift) % 256)
            else:
                result += char
        return result

def main():
    """Run complete cipher mapping"""
    print("="*70)
    print("COMPLETE BIBLE CIPHER MAPPING SYSTEM")
    print("="*70)
    
    mapper = CompleteCipherMapper()
    
    # Generate all mappings
    mapper.export_all_mappings()
    
    # Create master guide
    master = mapper.create_master_cipher_document()
    
    # Display summary
    print("\n" + "="*70)
    print("SUMMARY OF GENERATED FILES")
    print("="*70)
    
    files = [
        'mapping_num_to_char.json',
        'mapping_char_frequency.json',
        'substitution_alphabets.json',
        'polyalphabetic_keys.json',
        'word_substitution_table.json',
        'caesar_tables.json',
        'number_grid_26x26.json',
        'all_shift_variations.json',
        'MASTER_CIPHER_GUIDE.json'
    ]
    
    for i, f in enumerate(files, 1):
        print(f"{i}. {f}")
    
    print("\n" + "="*70)
    print("KEY FINDINGS")
    print("="*70)
    
    print(f"\nBible contains: {master['metadata']['bible_length']:,} characters")
    print(f"Bible numbers: {master['metadata']['number_count']:,} total")
    print(f"Unique numbers: {master['metadata']['unique_numbers']:,}")
    
    print("\nMost common numbers in Bible:")
    for num, count in master['number_statistics']['most_common'][:10]:
        print(f"  {num}: appears {count} times")
    
    print("\nMost common letters in Bible:")
    for char, count in master['character_statistics']['most_common_letters'][:10]:
        print(f"  '{char}': appears {count:,} times")
    
    print("\n" + "="*70)
    print("RECOMMENDED DECODING STRATEGIES")
    print("="*70)
    for strategy in master['recommended_decoding_strategies']:
        print(f"  {strategy}")
    
    print("\n" + "="*70)
    print("ALL CIPHER FILES GENERATED SUCCESSFULLY!")
    print("="*70)

if __name__ == "__main__":
    main()
