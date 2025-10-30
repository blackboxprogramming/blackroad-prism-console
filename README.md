# Bible Cipher Analysis System for Rohonc Codex
## Complete Cryptographic Toolkit

This system uses the King James Version Bible as a comprehensive cipher key to decode the Rohonc Codex (or any encrypted text). It implements your specifications:

- **Caesar cipher with 256-string partition** (shift: 18)
- **Caesar cipher with 26-letter alphabet** (shift: 18)  
- **Complete number extraction** from the Bible
- **"Giant word search"** pattern analysis
- **Multiple decoding strategies**

---

## 🔑 KEY SPECIFICATIONS

### Caesar Ciphers
1. **256-Partition (Extended ASCII)**: Shift = 18
   - Every character (including symbols) shifted by 18 in ASCII space
   - Modulo 256 for wraparound
   - Example: "In the beginning" → special characters

2. **26-Partition (Standard Alphabet)**: Shift = 18  
   - Only letters shifted, case preserved
   - Modulo 26 for wraparound
   - Example: "In the beginning" → "Af lzw twyaffafy"

### Bible Numbers
- **Total numbers extracted**: 8,144
- **Unique numbers**: 525
- **Range**: 1 to 525
- **Most common**: 7 (257 times), 4 (256 times), 8 (255 times)

These numbers appear in:
- Verse numbers (Genesis 1:1, 1:2, etc.)
- Chapter numbers  
- Reference markers
- Page numbers

---

## 📁 GENERATED FILES

### Core Cipher Files
1. **`bible_full.txt`** - Complete Bible text (1,001,703 characters)
2. **`bible_numbers.txt`** - All 8,144 numbers in order
3. **`cipher_keys.json`** - Precomputed cipher keys
4. **`MASTER_CIPHER_GUIDE.json`** - Complete cipher reference

### Mapping Files
5. **`mapping_num_to_char.json`** - Number → Character lookup
6. **`mapping_char_frequency.json`** - Character frequency ranks
7. **`substitution_alphabets.json`** - Various alphabet orderings
8. **`polyalphabetic_keys.json`** - Vigenère-style key sequences
9. **`word_substitution_table.json`** - Common word mappings
10. **`caesar_tables.json`** - All Caesar shift tables
11. **`number_grid_26x26.json`** - 26×26 matrix of Bible numbers
12. **`all_shift_variations.json`** - Test encryptions with all shifts

### Analysis Files
13. **`rohonc_analysis.json`** - Statistical analysis results

---

## 🔍 DECODING STRATEGIES

### 1. Caesar Decryption (Shift 18)

**For alphabet (26):**
```python
# Decode: shift backwards by 18
for char in ciphertext:
    if char.isalpha():
        base = ord('A') if char.isupper() else ord('a')
        plain = chr((ord(char) - base - 18) % 26 + base)
```

**For ASCII (256):**
```python
# Decode: shift backwards by 18 in full ASCII
for char in ciphertext:
    plain = chr((ord(char) - 18) % 256)
```

### 2. Number Sequence Decoding

If Rohonc contains number sequences:
```python
# Use numbers as direct indices into Bible text
for number in sequence:
    if number < len(bible_text):
        decoded_char = bible_text[number]
```

### 3. Polyalphabetic (Vigenère-style)

Use Bible numbers as the key:
```python
# Each position uses different Bible number as shift
for i, char in enumerate(ciphertext):
    shift = bible_numbers[i % len(bible_numbers)]
    plain = decrypt_with_shift(char, shift)
```

### 4. Frequency Analysis

Map Rohonc symbols to Bible letters by frequency:
```
Most common Bible letters: e, t, a, h, o, n, s, i, r, d
Most common Rohonc symbols: ??? (map to above)
```

### 5. Pattern Matching ("Giant Word Search")

Search for common Bible patterns:
- "the children of" (67 times)
- "In the beginning" (multiple times)
- Look for these patterns in decoded Rohonc

### 6. Coordinate System

Interpret numbers as Bible coordinates:
```
Format: [chapter, verse, word]
Example: [1, 1, 1] → "In" (Genesis 1:1, first word)
```

---

## 📊 STATISTICAL FINDINGS

### Bible Character Frequencies
```
' ' (space): 173,063 times (17.3%)
'e':         97,486 times (9.7%)
't':         75,279 times (7.5%)
'a':         68,092 times (6.8%)
'h':         66,979 times (6.7%)
'o':         58,949 times (5.9%)
```

### Bible Number Patterns

**Consecutive sequences found**: 4,370
- Example: [1, 2, 3, 4, 5, 6]

**Repeating patterns found**: 6,114
- Pattern (2, 3, 4) repeats 224 times
- Pattern (3, 4, 5) repeats 224 times

**Arithmetic sequences**: Detected in verse numbering

---

## 🎯 HOW TO USE THIS SYSTEM

### Step 1: Load Your Rohonc Data
```python
# If you have Rohonc as text
rohonc_text = "your encrypted text here"

# If you have Rohonc as numbers
rohonc_numbers = [123, 456, 789, ...]
```

### Step 2: Try Caesar Decryption (18, 26)
```python
from bible_cipher_analysis import BibleCipherAnalyzer

analyzer = BibleCipherAnalyzer()
decrypted = analyzer.caesar_cipher_26(rohonc_text, key=-18)  # Negative to decrypt
print(decrypted)
```

### Step 3: Try Caesar Decryption (18, 256)
```python
decrypted_256 = analyzer.caesar_cipher_256(rohonc_text, key=-18)
print(decrypted_256)
```

### Step 4: Try Number Sequence Decoding
```python
from rohonc_decoder import RohoncDecoder

decoder = RohoncDecoder()
decoded = decoder.decode_number_sequence(rohonc_numbers)
print(decoded)
```

### Step 5: Analyze Patterns
```python
# Find common patterns
patterns = decoder.giant_word_search(pattern_length=15)

# Check if decoded text contains Bible patterns
for pattern, count in patterns:
    if pattern in decoded_text:
        print(f"Match found: {pattern}")
```

---

## 🔢 EXAMPLE TRANSFORMATIONS

### Caesar Shift 18 (Alphabet)
```
Plaintext:  "In the beginning God created"
Encrypted:  "Af lzw twyaffafy Ygv ujwslwv"
```

To decrypt Rohonc with this method:
- Shift each letter **backward** by 18 (or forward by 8)
- A→I, B→J, C→K, ..., Z→H

### Caesar Shift 18 (ASCII 256)
```
Plaintext:  "In the beginning"
Encrypted:  [special characters - see hex output]
```

To decrypt:
- Subtract 18 from ASCII value of each character
- Apply modulo 256

---

## 🧮 BIBLE NUMBERS AS CIPHER KEY

The complete sequence of 8,144 Bible numbers can be used as:

1. **Direct substitution**: Number N → Character at position N
2. **Vigenère key**: Use numbers as shift amounts
3. **Index table**: Map Rohonc symbol positions to Bible positions
4. **Coordinate system**: [chapter:verse:word] addressing

### Example: Polyalphabetic Decryption
```python
bible_key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...]  # First 100 numbers

for i, char in enumerate(rohonc_text):
    shift = bible_key[i % len(bible_key)]
    plain_char = decrypt(char, shift)
```

---

## 🔬 ADVANCED TECHNIQUES

### Pattern Correlation
```python
# Compare Rohonc patterns with Bible patterns
rohonc_patterns = extract_patterns(rohonc, length=10)
bible_patterns = extract_patterns(bible, length=10)

# Find matching patterns
matches = set(rohonc_patterns) & set(bible_patterns)
```

### Frequency Matching
```python
# Rank symbols by frequency
rohonc_freq = Counter(rohonc_symbols)
bible_freq = Counter(bible_text)

# Create mapping based on frequency rank
mapping = {}
for r_sym, b_char in zip(rohonc_freq.most_common(), 
                          bible_freq.most_common()):
    mapping[r_sym[0]] = b_char[0]
```

### Reverse Engineering
```python
# If you have ANY known plaintext/ciphertext pairs
known_plain = "God"
known_cipher = "???"  # From Rohonc

# Find which Bible numbers produce this transformation
key = reverse_engineer_key(known_plain, known_cipher)
```

---

## 📖 BIBLE STRUCTURE

The Bible text includes:
- **Genesis** (starting at character position ~19,000)
- **Verse structure**: "1In the beginning...", "2And the earth..."
- **Chapter markers**: "Chapter 1", "Chapter 2", etc.
- **Books**: Genesis, Exodus, Leviticus, Numbers, Deuteronomy...

Key verses for testing:
- **Genesis 1:1**: "In the beginning God created the heaven and the earth"
- **Genesis 1:3**: "And God said, Let there be light: and there was light"

---

## 🎨 VISUALIZATION IDEAS

1. **Heat map**: Show frequency of Bible numbers
2. **Pattern graph**: Common sequences in Bible vs Rohonc  
3. **Character distribution**: Compare Bible vs decoded Rohonc
4. **Word cloud**: Most common words in Bible

---

## ⚠️ IMPORTANT NOTES

1. **The Rohonc Codex is unsolved** - This system provides tools, not guaranteed decryption
2. **Multiple interpretations possible** - Try all methods
3. **Partial matches count** - Even partial decryption is progress
4. **Pattern recognition** - Look for recognizable words or phrases
5. **Statistical analysis** - Compare letter frequencies with English/Bible

---

## 🚀 NEXT STEPS

To use this with actual Rohonc Codex images:
1. OCR the Rohonc pages to extract symbols
2. Create symbol→number mapping
3. Apply each decryption method
4. Look for patterns matching Bible text
5. Iterate and refine

The key insight: **If the Bible is the key, decoded text should contain Biblical words, phrases, or patterns.**

---

## 📚 FILES REFERENCE

All generated files are in `/home/claude/` and `/mnt/user-data/outputs/`:

- **Analysis tools**: `bible_cipher_analysis.py`, `rohonc_decoder.py`, `complete_cipher_mapper.py`
- **Data files**: `bible_full.txt`, `bible_numbers.txt`, `genesis.txt`
- **Mappings**: All `*.json` files with cipher tables
- **Documentation**: This README

---

## 💡 KEY TAKEAWAYS

1. **Caesar Shift 18** is implemented for both 26-letter and 256-character systems
2. **All 8,144 Bible numbers** are extracted and available
3. **Multiple cipher strategies** are provided
4. **Pattern matching** tools for "giant word search"
5. **Frequency analysis** tables included
6. **Complete mappings** generated and saved

**The system is ready to decode!** 🔓

Upload actual Rohonc Codex symbol data to begin real decryption attempts.
