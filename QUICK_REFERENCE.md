# 🔐 QUICK REFERENCE GUIDE
## Bible Cipher System for Rohonc Codex

---

## 📋 YOUR SPECIFICATIONS

✅ **Caesar Cipher - 256 String Partition - Shift 18**
✅ **Caesar Cipher - 26 Letter Alphabet - Shift 18**  
✅ **Complete Bible Number Extraction (8,144 numbers)**
✅ **"Giant Word Search" Pattern Analysis**
✅ **Multiple Decoding Strategies**

---

## 🎯 QUICK START

### Decrypt with Caesar (18, 26)
```python
python3 bible_cipher_analysis.py
# Use caesar_cipher_26() with key=-18 to decrypt
```

### Decrypt with Caesar (18, 256)
```python
python3 rohonc_decoder.py  
# Use decode_with_caesar_partition() with shift=18
```

### Try All Methods
```python
python3 complete_cipher_mapper.py
# Generates all cipher mappings
```

---

## 🔢 THE NUMBERS

### Bible Number Statistics
```
Total Numbers:     8,144
Unique Numbers:    525
Range:             1 to 525
Most Common:       7 (257×), 4 (256×), 8 (255×)
```

### First 20 Bible Numbers
```
1, 2, 3, 4, 5, 6, 7, 8, 9, 10
11, 12, 13, 14, 15, 16, 17, 18, 19, 20
```

### Use Cases
1. Direct position index (number → character in Bible)
2. Polyalphabetic key (shift amount for each position)
3. Coordinate system (chapter:verse:word)
4. Pattern matching (sequences)

---

## 🔤 CAESAR CIPHER EXAMPLES

### Alphabet (26) - Shift 18

**Encoding:**
```
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓
S T U V W X Y Z A B C D E F G H I J K L M N O P Q R
```

**Example:**
```
Plaintext:  "In the beginning God created"
Encrypted:  "Af lzw twyaffafy Ygv ujwslwv"
```

**To Decrypt:** Shift backward by 18 (or forward by 8)

### ASCII (256) - Shift 18

**Example:**
```
Plaintext:  "In the beginning"
Encrypted:  [hex: 0x49→0x5B, 0x6E→0x80, etc.]
```

**To Decrypt:** `chr((ord(char) - 18) % 256)`

---

## 📊 CHARACTER FREQUENCIES

### Top 10 Bible Letters
```
1. 'e' - 97,486 occurrences (9.7%)
2. 't' - 75,279 occurrences (7.5%)
3. 'a' - 68,092 occurrences (6.8%)
4. 'h' - 66,979 occurrences (6.7%)
5. 'o' - 58,949 occurrences (5.9%)
6. 'n' - 55,575 occurrences (5.5%)
7. 's' - 43,915 occurrences (4.4%)
8. 'i' - 42,549 occurrences (4.2%)
9. 'r' - 41,247 occurrences (4.1%)
10. 'd' - 38,856 occurrences (3.9%)
```

### Application
Map most frequent Rohonc symbols to these letters!

---

## 🔍 "GIANT WORD SEARCH" PATTERNS

### Most Common 15-Character Patterns
```
1. "the children of" - 67 matches
2. "he children of " - 64 matches
3. " the children o" - 59 matches
4. " children of Is" - 55 matches
5. "ildren of Israe" - 53 matches
```

### How to Use
1. Decrypt Rohonc with various methods
2. Search for these patterns in output
3. Matches = correct decryption method!

---

## 🗺️ DECRYPTION ROADMAP

```
┌─────────────────────────────────────────┐
│         ROHONC CODEX DATA               │
│  (symbols, numbers, or encrypted text)  │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼───────┐   ┌────▼────────────┐
│ Method 1:     │   │ Method 2:       │
│ Caesar (18,26)│   │ Caesar (18,256) │
└───────┬───────┘   └────┬────────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Method 3:       │
        │ Number Sequence │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Method 4:       │
        │ Polyalphabetic  │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Method 5:       │
        │ Frequency Match │
        └────────┬────────┘
                 │
        ┌────────▼────────────┐
        │ Check for Patterns  │
        │ • Bible words       │
        │ • Common phrases    │
        │ • Known verses      │
        └─────────────────────┘
```

---

## 📁 KEY FILES

### Analysis Tools
- `bible_cipher_analysis.py` - Main cipher engine
- `rohonc_decoder.py` - Comprehensive decoder
- `complete_cipher_mapper.py` - Mapping generator

### Data Files
- `bible_full.txt` - Full Bible text (980 KB)
- `bible_numbers.txt` - All 8,144 numbers
- `MASTER_CIPHER_GUIDE.json` - Complete reference

### Mapping Files
- `mapping_num_to_char.json` - Number→Character
- `caesar_tables.json` - All shift tables
- `polyalphabetic_keys.json` - Vigenère keys
- `word_substitution_table.json` - Common words
- `all_shift_variations.json` - Test encryptions

---

## ⚡ TESTING YOUR DECRYPTION

### Signs of Correct Decryption

✅ **Good signs:**
- Recognizable English words appear
- Bible phrases visible ("In the beginning", "God created")
- Letter frequencies match English/Bible
- Common words: "the", "and", "of", "to"

❌ **Bad signs:**
- All gibberish
- No vowels or all vowels
- No recognizable patterns
- Frequencies don't match any language

---

## 🎲 EXAMPLE WORKFLOWS

### Workflow 1: Test All Caesar Shifts
```bash
# Generate all possible shifts
python3 -c "
from bible_cipher_analysis import BibleCipherAnalyzer
analyzer = BibleCipherAnalyzer()
test = 'YOUR_ROHONC_TEXT_HERE'
for shift in range(26):
    result = analyzer.caesar_cipher_26(test, key=-shift)
    if 'the' in result.lower() or 'god' in result.lower():
        print(f'Shift {shift}: {result}')
"
```

### Workflow 2: Decode Number Sequence
```python
from rohonc_decoder import RohoncDecoder
decoder = RohoncDecoder()

# If Rohonc contains: [100, 200, 300, ...]
rohonc_numbers = [100, 200, 300, 400, 500]
decoded = decoder.decode_number_sequence(rohonc_numbers)
print(decoded)
```

### Workflow 3: Frequency Correlation
```python
from complete_cipher_mapper import CompleteCipherMapper
mapper = CompleteCipherMapper()

# Map Rohonc symbols by frequency
rohonc_symbols = "your symbols here"
mapping = mapper.correlate_rohonc_bible(rohonc_symbols)
```

---

## 🧪 VERIFICATION TESTS

### Test 1: Caesar (18, 26)
```
Input:  "Af lzw twyaffafy"
Shift:  -18 (or +8)
Output: "In the beginning" ✓
```

### Test 2: Number Lookup
```
Input:  [100, 200, 300]
Lookup: bible_text[100], bible_text[200], bible_text[300]
Output: Should be readable characters
```

### Test 3: Pattern Match
```
Input:  Decoded text
Search: "the children of", "In the beginning"
Output: Any matches? ✓
```

---

## 💡 PRO TIPS

1. **Try multiple methods** - The key might be a combination
2. **Look for partial matches** - Even fragments are progress
3. **Check all shifts** - Not just 18, try 17, 19, 26, etc.
4. **Use frequency analysis** - Match symbol frequencies to letter frequencies
5. **Test with known text** - If any Rohonc portions are known, verify methods
6. **Pattern recognition** - Bible has specific patterns ("And God said")

---

## 🎯 SUCCESS CRITERIA

Your decryption is likely correct if:

1. ✅ Text contains recognizable English words
2. ✅ Letter frequencies match English (e, t, a, h, o common)
3. ✅ Bible phrases appear ("God", "Lord", "children of Israel")
4. ✅ Grammar makes sense
5. ✅ Punctuation appears in logical places
6. ✅ Words are separated by spaces
7. ✅ Text is readable by humans

---

## 🚀 READY TO DECODE!

You now have:
- ✅ All Bible numbers (8,144 total)
- ✅ Caesar cipher (18, 26) implementation
- ✅ Caesar cipher (18, 256) implementation
- ✅ Complete character/number mappings
- ✅ Pattern analysis tools
- ✅ Frequency tables
- ✅ Multiple decoding strategies

**Next step:** Upload actual Rohonc Codex data and apply these methods!

---

## 📞 NEED HELP?

All tools are documented in:
- `README.md` - Complete guide
- `MASTER_CIPHER_GUIDE.json` - JSON reference
- Python files - Heavily commented code

Run any script with `python3 filename.py` to see examples!

**Good luck decoding! 🔓**
