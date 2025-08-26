from flask import Flask, request, jsonify
from flask_cors import CORS
from scraper_logic import GoogleShoppingScraper
import traceback
import os
import json

app = Flask(__name__)
CORS(app)

# Path to available filters JSON
FILTERS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'available-filters.json')

@app.route('/scrape', methods=['POST'])
def scrape():
    try:
        data = request.get_json()
        if not data or 'base_query' not in data or 'filters' not in data:
            return jsonify({'error': 'Missing base_query or filters in request.'}), 400
        base_query = data['base_query']
        filters = data['filters']
        scraper = GoogleShoppingScraper()
        try:
            scraper.apply_filters_and_get_url(base_query, filters)
            products = scraper.scrape_product_results()
        finally:
            scraper.close()
        return jsonify(products), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/filters', methods=['GET'])
def get_filters():
    try:
        with open(FILTERS_PATH, encoding='utf-8') as f:
            filters = json.load(f)
        return jsonify(filters), 200
    except Exception as e:
        return jsonify({'error': f'Could not load filters: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
