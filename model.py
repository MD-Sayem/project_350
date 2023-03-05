#!pip install --upgrade pip

# 👇️ in a virtual environment or using Python 2
#pip install tensorflow
import pickle

import numpy as np
# import tensorflow as tf
from tensorflow import keras

batch_size = 64  # Batch size for training.
epochs = 100  # Number of epochs to train for.
latent_dim = 256  # Latent dimensionality of the encoding space.
num_samples = 52000  # Number of samples to train on.
num_test = 12000  #Number of samples to test
# Path to the data txt file on disk.
data_path = "content/training_data_52K.txt"
test_path = "content/testing_data_12K.txt"


input_texts = []
target_texts = []
test_texts =[]
output_texts=[]
input_characters = set()
target_characters = set()
test_characters= set()
output_characters= set()
with open(data_path, "r", encoding="utf-8") as f:
    lines = f.read().split("\n")
with open(test_path, "r", encoding="utf-8") as f2:
    test_lines = f2.read().split("\n")


for line in lines[: min(num_samples, len(lines) - 1)]:
    input_text, target_text = line.split("\t")
    # print(input_text,"  ",target_text)
    # We use "tab" as the "start sequence" character
    # for the targets, and "\n" as "end sequence" character.
    target_text = "\t" + target_text + "\n"
    input_texts.append(input_text)
    target_texts.append(target_text)
    #input_characters.add(' ');
    for char in input_text:
        if char not in input_characters:
            input_characters.add(char)
    
    #target_characters.add(' ');
    for char in target_text:
        if char not in target_characters:
            target_characters.add(char)

#for testing

for lin in test_lines[: min(num_samples, len(test_lines) - 1)]:
    test_text, output_text = lin.split("\t")
    # print(test_text," ",output_text)
    # We use "tab" as the "start sequence" character
    # for the targets, and "\n" as "end sequence" character.
    output_text = "\t" + output_text + "\n"
    test_texts.append(test_text)
    output_texts.append(output_text)
    #input_characters.add(' ');
    for char in test_text:
        if char not in test_characters:
            test_characters.add(char)
    
    #target_characters.add(' ');
    for char in output_text:
        if char not in output_characters:
            output_characters.add(char)

#end testing
    

input_characters = sorted(list(input_characters))
target_characters = sorted(list(target_characters))
test_characters =sorted(list(test_characters))
output_characters=sorted(list(output_characters))

num_encoder_tokens = len(input_characters)
num_decoder_tokens = len(target_characters)
num_test_tokens= len(test_characters)
num_output_tokens= len(output_characters)

max_encoder_seq_length = max([len(txt) for txt in input_texts])
max_decoder_seq_length = max([len(txt) for txt in target_texts])
max_test_seq_length = max([len(txt) for txt in test_texts])
max_output_seq_length = max([len(txt) for txt in output_texts])



print("Number of samples:", len(input_texts))
print("Number of unique input tokens:", num_encoder_tokens)
print("Number of unique output tokens:", num_decoder_tokens)
print("Max sequence length for inputs:", max_encoder_seq_length)
print("Max sequence length for outputs:", max_decoder_seq_length)

input_token_index = dict([(char, i) for i, char in enumerate(input_characters)])
target_token_index = dict([(char, i) for i, char in enumerate(target_characters)])
test_token_index = dict([(char, i) for i, char in enumerate(test_characters)])
output_token_index = dict([(char, i) for i, char in enumerate(output_characters)])


#encoding for training
encoder_input_data = np.zeros(
    (len(input_texts), max_encoder_seq_length, num_encoder_tokens), dtype="float32"
)
decoder_input_data = np.zeros(
    (len(input_texts), max_decoder_seq_length, num_decoder_tokens), dtype="float32"
)
decoder_target_data = np.zeros(
    (len(input_texts), max_decoder_seq_length, num_decoder_tokens), dtype="float32"
)

#for testing
encoder_test_data = np.zeros(
    (len(test_texts), max_encoder_seq_length, num_encoder_tokens), dtype="float32"
)
decoder_test_data = np.zeros(
    (len(test_texts), max_output_seq_length, num_output_tokens), dtype="float32"
)
decoder_output_data = np.zeros(
    (len(test_texts), max_output_seq_length, num_output_tokens), dtype="float32"
)

#for Training
for i, (input_text, target_text) in enumerate(zip(input_texts, target_texts)):
    for t, char in enumerate(input_text):
        encoder_input_data[i, t, input_token_index[char]] = 1.0
    encoder_input_data[i, t + 1 :, input_token_index['়']] = 1.0
    for t, char in enumerate(target_text):
        # decoder_target_data is ahead of decoder_input_data by one timestep
        decoder_input_data[i, t, target_token_index[char]] = 1.0
        if t > 0:
            # decoder_target_data will be ahead by one timestep
            # and will not include the start character.
            decoder_target_data[i, t - 1, target_token_index[char]] = 1.0
    decoder_input_data[i, t + 1 :, target_token_index['়']] = 1.0
    decoder_target_data[i, t:, target_token_index['়']] = 1.0
    
#for testing
for i, (test_text, output_text) in enumerate(zip(test_texts, output_texts)):
    for t, char in enumerate(test_text):
        encoder_test_data[i, t, input_token_index[char]] = 1.0
    encoder_test_data[i, t + 1 :, input_token_index['়']] = 1.0
#     for t, char in enumerate(output_text):
#         # decoder_target_data is ahead of decoder_input_data by one timestep
#         decoder_test_data[i, t, output_token_index[char]] = 1.0
#         if t > 0:
#             # decoder_target_data will be ahead by one timestep
#             # and will not include the start character.
#             print(char)
#             decoder_target_data[i, t - 1, target_token_index[char]] = 1.0
#     decoder_test_data[i, t + 1 :, target_token_index['়']] = 1.0
#     decoder_output_data[i, t:, target_token_index['়']] = 1.0

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

# model.compile(
#     optimizer="rmsprop", loss="categorical_crossentropy", metrics=["accuracy"]
# )
# model.fit(
#     [encoder_input_data, decoder_input_data],
#     decoder_target_data,
#     batch_size=batch_size,
#     epochs=epochs,
#     validation_split=0.2,
# )
# model.save("content/se2se")
#
# #save model as pickle
# pickle.dump(model, open("content/seq2seq.pkl", "wb"))

# Define sampling models
# Restore the model and construct the encoder and decoder.
model = keras.models.load_model("content/se2se")

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
print('ready for running')

for seq_index in range(10):
    # Take one sequence (part of the training set)
    # for trying out decoding.
    # input_seq = encoder_input_data[seq_index : seq_index + 1]
    input_seq = encoder_input_data[seq_index : seq_index + 1]
    decoded_sentence = decode_sequence(input_seq)
    print("-")
    print("Input sentence:", input_texts[seq_index])
    print("Decoded sentence:", decoded_sentence)

print('alhamdulillah')
#
# #test_line="content/test_line.txt"
# #for testing a line
# #with open(test_line, "r", encoding="utf-8") as f3:
# #    words = f3.read().split(" ")
# #for_line_input
# sentence="আহসানের লেখাতে শারমিনের গুপ্তহত্যার ভিডিওগুলো প্রস্তুতকর্তা পুলিশদের অবর্তমানে হামলাকারীর শত্রুতার ভুক্তভোগী"
# words=sentence.split(" ")
# max_input_word_length = max([len(txt) for txt in words])
#
# #for testing a line
# encoder_input_line = np.zeros(
#     (len(words), max_encoder_seq_length, num_encoder_tokens), dtype="float32"
# )


#for line
# output_words=['kono' , 'dorkar' , 'nai']
# for i, (test_word, output_word) in enumerate(zip(words,words)):
#     for t, char in enumerate(test_word):
#         encoder_input_line[i, t, input_token_index[char]] = 1.0     #this variable
#     encoder_input_line[i, t + 1 :, input_token_index['়']] = 1.0
#
# for seq_index in range(len(words)):
    # # Take one sequence (part of the training set)
    # # for trying out decoding.
    # # input_seq = encoder_input_data[seq_index : seq_index + 1]
    # input_seq = encoder_input_line[seq_index : seq_index + 1]
    # decoded_sentence = decode_sequence(input_seq)       #this function
    # print("-")
    # print("Input word:", words[seq_index])
    # print("Decoded word:", decoded_sentence)

def getTokens():
    return input_token_index,max_encoder_seq_length, num_encoder_tokens