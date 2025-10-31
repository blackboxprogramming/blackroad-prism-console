#!/usr/bin/env python3
"""
Bible Cipher Analysis System
Implements multiple cipher techniques using KJV Bible as the key
"""

import re
from collections import defaultdict, Counter
import json


def _make_logger(verbose: bool):
    """Return a callable that prints only when verbose is True."""

    def _logger(message=""):
        if verbose:
            print(message)

    return _logger


class BibleCipherAnalyzer:
    def __init__(self, bible_text_file='bible_full.txt', *, verbose=True):
        """Initialize with Bible text"""
        self.verbose = verbose
        self._log = _make_logger(verbose)
        with open(bible_text_file, 'r', encoding='utf-8') as f:
            self.bible_text = f.read()

        self.prepare_cipher_keys()
    
    def prepare_cipher_keys(self):
        """Extract various numerical and textual patterns from Bible"""
        
        # Extract all numbers
        self.all_numbers = [int(n) for n in re.findall(r'\d+', self.bible_text) if n]
        self._log(f"Total numbers extracted: {len(self.all_numbers)}")
        
        # Extract verse numbers (format: number at start of line or after whitespace)
        self.verse_numbers = []
        for line in self.bible_text.split('\n'):
            match = re.match(r'^(\d+)', line.strip())
            if match:
                self.verse_numbers.append(int(match.group(1)))
        
        self._log(f"Verse numbers: {len(self.verse_numbers)}")
        
        # Create chapter:verse mapping
        self.chapter_verse_pairs = re.findall(r'Chapter (\d+)|^(\d+)And', self.bible_text, re.MULTILINE)
        
        # Extract unique words for substitution cipher
        words = re.findall(r'\b[A-Za-z]+\b', self.bible_text)
        self.unique_words = list(set(words))
        self.word_frequency = Counter(words)
        
        self._log(f"Unique words: {len(self.unique_words)}")
        self._log(f"Total words: {len(words)}")
        
    def caesar_cipher_256(self, text, key=18):
        """
        Caesar cipher with 256-character partition (extended ASCII)
        Key default: 18 (as you specified)
        """
        result = []
        for char in text:
            # Convert to ASCII value
            ascii_val = ord(char)
            # Apply Caesar shift with modulo 256
            shifted = (ascii_val + key) % 256
            result.append(chr(shifted))
        return ''.join(result)
    
    def caesar_cipher_26(self, text, key=18):
        """
        Traditional Caesar cipher with 26-letter alphabet
        Key default: 18
        """
        result = []
        for char in text:
            if char.isalpha():
                # Get base (A or a)
                base = ord('A') if char.isupper() else ord('a')
                # Apply Caesar shift
                shifted = (ord(char) - base + key) % 26
                result.append(chr(base + shifted))
            else:
                result.append(char)
        return ''.join(result)
    
    def number_substitution_cipher(self, text):
        """
        Replace each letter with corresponding Bible number
        Uses Bible numbers as substitution key
        """
        result = []
        for i, char in enumerate(text):
            if char.isalpha() and i < len(self.all_numbers):
                result.append(str(self.all_numbers[i % len(self.all_numbers)]))
            else:
                result.append(char)
        return ' '.join(result)
    
    def verse_number_cipher(self, text):
        """
        Use verse numbers (1-31 from verses) as cipher key
        """
        result = []
        verse_idx = 0
        for char in text:
            if char.isalpha():
                if verse_idx < len(self.verse_numbers):
                    key = self.verse_numbers[verse_idx % len(self.verse_numbers)]
                    if char.isupper():
                        shifted = (ord(char) - ord('A') + key) % 26
                        result.append(chr(ord('A') + shifted))
                    else:
                        shifted = (ord(char) - ord('a') + key) % 26
                        result.append(chr(ord('a') + shifted))
                    verse_idx += 1
            else:
                result.append(char)
        return ''.join(result)
    
    def word_search_pattern(self, target_phrase):
        """
        Giant word search - find target phrase in Bible
        Returns all positions where phrase appears
        """
        positions = []
        search_text = self.bible_text.lower()
        target = target_phrase.lower()
        
        start = 0
        while True:
            pos = search_text.find(target, start)
            if pos == -1:
                break
            positions.append(pos)
            start = pos + 1
        
        return positions
    
    def extract_number_sequence(self):
        """
        Extract complete number sequence from Bible for cipher analysis
        Returns numbers in order of appearance
        """
        return self.all_numbers
    
    def gematria_analysis(self, text):
        """
        Simple gematria: A=1, B=2, etc.
        Compares with Bible number patterns
        """
        values = []
        for char in text.upper():
            if char.isalpha():
                values.append(ord(char) - ord('A') + 1)
        
        return values
    
    def generate_cipher_keys(self):
        """
        Generate multiple cipher keys from Bible numbers
        """
        keys = {
            'first_100_numbers': self.all_numbers[:100],
            'verse_numbers': self.verse_numbers[:100],
            'unique_numbers': list(set(self.all_numbers))[:100],
            'fibonacci_indexed': [self.all_numbers[i] for i in [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89] if i < len(self.all_numbers)],
            'prime_indexed': [self.all_numbers[i] for i in [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31] if i < len(self.all_numbers)],
        }
        
        return keys
    
    def analyze_number_patterns(self):
        """
        Analyze patterns in Bible numbers for cipher detection
        """
        analysis = {
            'total_numbers': len(self.all_numbers),
            'unique_numbers': len(set(self.all_numbers)),
            'number_range': (min(self.all_numbers), max(self.all_numbers)),
            'most_common': Counter(self.all_numbers).most_common(20),
            'first_100': self.all_numbers[:100],
            'statistical_properties': {
                'mean': sum(self.all_numbers) / len(self.all_numbers),
                'median': sorted(self.all_numbers)[len(self.all_numbers)//2],
            }
        }
        
        return analysis

def main():
    """Run cipher analysis"""
    print("="*70)
    print("BIBLE CIPHER ANALYSIS SYSTEM")
    print("="*70)
    
    analyzer = BibleCipherAnalyzer()
    
    print("\n1. CAESAR CIPHER (256-bit partition, key=18)")
    print("-" * 70)
    test_text = "In the beginning God created"
    encrypted_256 = analyzer.caesar_cipher_256(test_text, key=18)
    print(f"Original: {test_text}")
    print(f"Encrypted (256): {repr(encrypted_256)}")
    
    print("\n2. CAESAR CIPHER (26-letter alphabet, key=18)")
    print("-" * 70)
    encrypted_26 = analyzer.caesar_cipher_26(test_text, key=18)
    print(f"Encrypted (26): {encrypted_26}")
    
    print("\n3. NUMBER SEQUENCE FROM BIBLE")
    print("-" * 70)
    keys = analyzer.generate_cipher_keys()
    print("First 100 numbers from Bible:")
    print(keys['first_100_numbers'])
    
    print("\n4. VERSE NUMBER CIPHER")
    print("-" * 70)
    verse_encrypted = analyzer.verse_number_cipher(test_text)
    print(f"Encrypted with verse numbers: {verse_encrypted}")
    
    print("\n5. STATISTICAL ANALYSIS")
    print("-" * 70)
    stats = analyzer.analyze_number_patterns()
    print(f"Total numbers in Bible: {stats['total_numbers']}")
    print(f"Unique numbers: {stats['unique_numbers']}")
    print(f"Range: {stats['number_range']}")
    print(f"Most common numbers: {stats['most_common'][:10]}")
    print(f"Mean: {stats['statistical_properties']['mean']:.2f}")
    
    print("\n6. GEMATRIA ANALYSIS")
    print("-" * 70)
    gematria = analyzer.gematria_analysis(test_text)
    print(f"Gematria values: {gematria}")
    print(f"Sum: {sum(gematria)}")
    
    # Save all cipher keys to file
    print("\n7. SAVING CIPHER KEYS")
    print("-" * 70)
    with open('cipher_keys.json', 'w') as f:
        # Convert to JSON-serializable format
        json_keys = {k: v for k, v in keys.items()}
        json.dump(json_keys, f, indent=2)
    print("Saved to cipher_keys.json")
    
    # Save complete number sequence
    with open('bible_numbers.txt', 'w') as f:
        f.write('\n'.join(map(str, analyzer.all_numbers)))
    print("Saved complete number sequence to bible_numbers.txt")

if __name__ == "__main__":
    main()
