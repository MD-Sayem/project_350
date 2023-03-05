# Importing essential libraries
from prediction import findRoot, tokenize
from flask import Flask, render_template, request
# import pickle
# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import StandardScaler
# from sklearn.linear_model import LogisticRegression

# Load the logistic regression model
# filename = 'classifier.pkl'
# classifier = pickle.load(open(filename, 'rb'))

# # Load the standardise data
# filename2 = 'scaler.pkl'
# scaler = pickle.load(open(filename2, 'rb'))

app = Flask(__name__)


# @app.route('/')
# def home():
#     # return render_template('index.html')
#     return render_template('landingPage.html')

@app.route('/')
def home():
    return render_template('rootFinder.html', ln=0, prediction=[], wds=[] , sentence='')

@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        
        bakko = request.form['word']

        words = tokenize(bakko)
        my_prediction = findRoot(words)

        return render_template('rootFinder.html', ln=len(words), prediction=my_prediction, wds=words, sentence=bakko)



if __name__ == '__main__':
    app.run(debug=True)
