import sys
import unicodedata
def tokenize(text):
    bn_nums = set([chr(i) for i in range(2432, 2560) if unicodedata.category(chr(i)).startswith("N")])
    bn_letters = set([chr(i) for i in range(2432, 2560) if
                      not unicodedata.category(chr(i)).startswith("C") and not unicodedata.category(chr(i)).startswith(
                          "N")])
    bn_letters_nums = bn_nums | bn_letters
    all_letters_nums = bn_letters_nums 
    if not text:
        return []
    new_text = ''
    for c in text:
        new_text += c if c in all_letters_nums else ' '
    return new_text.split()

print(tokenize(sentence))
sys.stdout.flush()