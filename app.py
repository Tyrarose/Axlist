import os
import webbrowser
from flask import Flask, render_template, request, redirect, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv  # Import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask app
app = Flask(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate(os.environ['FIREBASE_SERVICE_ACCOUNT_KEY'])
firebase_admin.initialize_app(cred)
db = firestore.client()

# Define the Firestore collection name
RULES_COLLECTION = 'rules'

# Route to render the checklist page
@app.route('/')
def checklist():
    # Retrieve all rules from Firestore
    rules_ref = db.collection(RULES_COLLECTION)
    rules = rules_ref.stream()
    rules_list = [{"id": rule.id, **rule.to_dict()} for rule in rules]
    return render_template('checklist.html', rules=rules_list)

# Add a new rule to Firestore
@app.route('/add_rule', methods=['POST'])
def add_rule():
    new_rule = request.form['new_rule']
    rule_data = {
        'text': new_rule,
        'checked': False
    }
    db.collection(RULES_COLLECTION).add(rule_data)
    return redirect('/')

# Toggle a rule's checked status
@app.route('/toggle_rule/<rule_id>', methods=['POST'])
def toggle_rule(rule_id):
    rule_ref = db.collection(RULES_COLLECTION).document(rule_id)
    if rule_ref.get().exists:
        data = request.get_json()
        rule_ref.update({'checked': data['checked']})
    return jsonify(success=True)

# Delete a specific rule from Firestore
@app.route('/delete_rule/<rule_id>', methods=['POST'])
def delete_rule(rule_id):
    rule_ref = db.collection(RULES_COLLECTION).document(rule_id)
    if rule_ref.get().exists:
        rule_ref.delete()
    return redirect('/')

# Reset all rules (set checked to False)
@app.route('/reset_rules', methods=['POST'])
def reset_rules():
    rules_ref = db.collection(RULES_COLLECTION)
    for rule in rules_ref.stream():
        rules_ref.document(rule.id).update({'checked': False})
    return redirect('/')

# Delete all rules from Firestore
@app.route('/delete_all', methods=['POST'])
def delete_all():
    rules_ref = db.collection(RULES_COLLECTION)
    for rule in rules_ref.stream():
        rules_ref.document(rule.id).delete()  # Deletes each rule from Firestore
    return redirect('/')

# Start the Flask application
if __name__ == "__main__":
    webbrowser.open("http://127.0.0.1:5000")  # Automatically open the browser when the app starts
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))  # Run the app
