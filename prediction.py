# from model import getTokens, decode_sequence
# import tensorflow as tf
# import sys
import unicodedata
#from tensorflow import keras
import keras
import numpy as np
import pickle

# seq2seq = pickle.load(open('content/seq2seq.pkl', 'rb'))
# my_prediction = seq2seq.predict(sentence)

input_token_index = {'ঁ': 0, 'ং': 1, 'ঃ': 2, 'অ': 3, 'আ': 4, 'ই': 5, 'ঈ': 6, 'উ': 7, 'ঊ': 8, 'ঋ': 9, 'এ': 10, 'ঐ': 11,
                     'ও': 12, 'ঔ': 13, 'ক': 14, 'খ': 15, 'গ': 16, 'ঘ': 17, 'ঙ': 18, 'চ': 19, 'ছ': 20, 'জ': 21, 'ঝ': 22,
                     'ঞ': 23, 'ট': 24, 'ঠ': 25, 'ড': 26, 'ঢ': 27, 'ণ': 28, 'ত': 29, 'থ': 30, 'দ': 31, 'ধ': 32, 'ন': 33,
                     'প': 34, 'ফ': 35, 'ব': 36, 'ভ': 37, 'ম': 38, 'য': 39, 'র': 40, 'ল': 41, 'শ': 42, 'ষ': 43, 'স': 44,
                     'হ': 45, '়': 46, 'া': 47, 'ি': 48, 'ী': 49, 'ু': 50, 'ূ': 51, 'ৃ': 52, 'ে': 53, 'ৈ': 54, 'ো': 55,
                     'ৌ': 56, '্': 57, 'ৎ': 58, 'ৗ': 59, 'ড়': 60, 'ঢ়': 61, 'য়': 62, 'ৰ': 63}
target_token_index = {'\t': 0, '\n': 1, 'ঁ': 2, 'ং': 3, 'ঃ': 4, 'অ': 5, 'আ': 6, 'ই': 7, 'ঈ': 8, 'উ': 9, 'ঊ': 10,
                      'ঋ': 11, 'এ': 12, 'ঐ': 13, 'ও': 14, 'ঔ': 15, 'ক': 16, 'খ': 17, 'গ': 18, 'ঘ': 19, 'ঙ': 20, 'চ': 21,
                      'ছ': 22, 'জ': 23, 'ঝ': 24, 'ঞ': 25, 'ট': 26, 'ঠ': 27, 'ড': 28, 'ঢ': 29, 'ণ': 30, 'ত': 31, 'থ': 32,
                      'দ': 33, 'ধ': 34, 'ন': 35, 'প': 36, 'ফ': 37, 'ব': 38, 'ভ': 39, 'ম': 40, 'য': 41, 'র': 42, 'ল': 43,
                      'শ': 44, 'ষ': 45, 'স': 46, 'হ': 47, '়': 48, 'া': 49, 'ি': 50, 'ী': 51, 'ু': 52, 'ূ': 53, 'ৃ': 54,
                      'ে': 55, 'ৈ': 56, 'ো': 57, 'ৌ': 58, '্': 59, 'ৎ': 60, 'ৗ': 61, 'ড়': 62, 'ঢ়': 63, 'য়': 64, 'ৰ': 65}
max_encoder_seq_length = 20
max_decoder_seq_length = 20
num_encoder_tokens = len(input_token_index)
num_decoder_tokens = len(target_token_index)
latent_dim = 256

def findRoot(words):
    # sentence = "আহসানের লেখাতে শারমিনের গুপ্তহত্যার ভিডিওগুলো প্রস্তুতকর্তা পুলিশদের অবর্তমানে হামলাকারীর শত্রুতার ভুক্তভোগী"
    # words = sentence.split(" ")
    #words = tokenize(sentence)
    max_input_word_length = max([len(txt) for txt in words])

    # input_token_index, max_encoder_seq_length, num_encoder_tokens = getTokens()

    # for testing a line
    encoder_input_line = np.zeros(
        (len(words), max_encoder_seq_length, num_encoder_tokens), dtype="float32"
    )

    # for line
    output_words = ['kono', 'dorkar', 'nai']
    for i, (test_word, output_word) in enumerate(zip(words, words)):
        for t, char in enumerate(test_word):
            encoder_input_line[i, t, input_token_index[char]] = 1.0  # this variable
        encoder_input_line[i, t + 1:, input_token_index['়']] = 1.0
    outputs = []
    for seq_index in range(len(words)):
        # Take one sequence (part of the training set)
        # for trying out decoding.
        # input_seq = encoder_input_data[seq_index : seq_index + 1]
        input_seq = encoder_input_line[seq_index: seq_index + 1]
        decoded_sentence = decode_sequence(input_seq)  # this function
        # print("-")
        # print("Input word:", words[seq_index])
        # print("Decoded word:", decoded_sentence)
        outputs.append(decoded_sentence.replace("\n", ""))

    return outputs


# Define an input sequence and process it.
encoder_inputs = keras.Input(shape=(None, num_encoder_tokens))
##encoder_inputs = keras.Input(shape=(None, 60))
encoder = keras.layers.LSTM(latent_dim, return_state=True)
encoder_outputs, state_h, state_c = encoder(encoder_inputs)

# We discard `encoder_outputs` and only keep the states.
encoder_states = [state_h, state_c]

# Set up the decoder, using `encoder_states` as initial state.
decoder_inputs = keras.Input(shape=(None, num_decoder_tokens))

# We set up our decoder to return full output sequences,
# and to return internal states as well. We don't use the
# return states in the training model, but we will use them in inference.
decoder_lstm = keras.layers.LSTM(latent_dim, return_sequences=True, return_state=True)
decoder_outputs, _, _ = decoder_lstm(decoder_inputs, initial_state=encoder_states)
decoder_dense = keras.layers.Dense(num_decoder_tokens, activation="softmax")
decoder_outputs = decoder_dense(decoder_outputs)

# Define the model that will turn
# `encoder_input_data` & `decoder_input_data` into `decoder_target_data`
model = keras.Model([encoder_inputs, decoder_inputs], decoder_outputs)
print('model_ready_to_compile')
# model=seq2seq
model = keras.models.load_model("content/se2se")
#model = pickle.load(open('content/seq2seq.pkl', 'rb'))

encoder_inputs = model.input[0]  # input_1
encoder_outputs, state_h_enc, state_c_enc = model.layers[2].output  # lstm_1
encoder_states = [state_h_enc, state_c_enc]
encoder_model = keras.Model(encoder_inputs, encoder_states)

decoder_inputs = model.input[1]  # input_2
decoder_state_input_h = keras.Input(shape=(latent_dim,))
decoder_state_input_c = keras.Input(shape=(latent_dim,))
decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]
decoder_lstm = model.layers[3]
decoder_outputs, state_h_dec, state_c_dec = decoder_lstm(
    decoder_inputs, initial_state=decoder_states_inputs
)
decoder_states = [state_h_dec, state_c_dec]
decoder_dense = model.layers[4]
decoder_outputs = decoder_dense(decoder_outputs)
decoder_model = keras.Model(
    [decoder_inputs] + decoder_states_inputs, [decoder_outputs] + decoder_states
)

# Reverse-lookup token index to decode sequences back to
# something readable.
reverse_input_char_index = dict((i, char) for char, i in input_token_index.items())
reverse_target_char_index = dict((i, char) for char, i in target_token_index.items())


def decode_sequence(input_seq):
    # Encode the input as state vectors.
    states_value = encoder_model.predict(input_seq)

    # Generate empty target sequence of length 1.
    target_seq = np.zeros((1, 1, num_decoder_tokens))
    # Populate the first character of target sequence with the start character.
    target_seq[0, 0, target_token_index["\t"]] = 1.0

    # Sampling loop for a batch of sequences
    # (to simplify, here we assume a batch of size 1).
    stop_condition = False
    decoded_sentence = ""
    while not stop_condition:
        output_tokens, h, c = decoder_model.predict([target_seq] + states_value)

        # Sample a token
        sampled_token_index = np.argmax(output_tokens[0, -1, :])
        sampled_char = reverse_target_char_index[sampled_token_index]
        decoded_sentence += sampled_char

        # Exit condition: either hit max length
        # or find stop character.
        if sampled_char == "\n" or len(decoded_sentence) > max_decoder_seq_length:
            stop_condition = True

        # Update the target sequence (of length 1).
        target_seq = np.zeros((1, 1, num_decoder_tokens))
        target_seq[0, 0, sampled_token_index] = 1.0

        # Update states
        states_value = [h, c]
    return decoded_sentence


# f=findRoot("শারমিনের গুপ্তহত্যার ভিডিওগুলো প্রস্তুতকর্তা পুলিশদের অবর্তমানে হামলাকারীর শত্রুতার ভুক্তভোগী")
# print(f)
# input_token_index
# decode_sequence


def tokenize(text):
    # bn_nums = set([chr(i) for i in range(2432, 2560) if unicodedata.category(chr(i)).startswith("N")])
    bn_letters = set([chr(i) for i in range(2432, 2560) if
                      not unicodedata.category(chr(i)).startswith("C") and not unicodedata.category(chr(i)).startswith(
                          "N")])
    bn_letters_nums =  bn_letters #| bn_nums 
    # en_nums = set([chr(i) for i in range(32,127) if unicodedata.category(chr(i)).startswith("N")])
    # en_letters = set([chr(i) for i in range(32,127) if unicodedata.category(chr(i)).startswith("L")])
    # en_letters_nums = en_nums | en_letters
    all_letters_nums = bn_letters_nums  # | en_letters_nums
    if not text:
        return []
    new_text = ''
    for c in text:
        new_text += c if c in all_letters_nums else ' '
    return new_text.split()

#st="রীতিমতো শূন্য অগ্রগতি নিয়েই অর্থবছর পার করেছে সরকারের ২৩৬টি প্রকল্প"
#print(tokenize(st))



