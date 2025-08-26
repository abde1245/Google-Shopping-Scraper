import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from urllib.parse import urljoin, quote_plus
import sys
import json
import re
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

sys.stdout.reconfigure(encoding='utf-8')

# --- Helper functions ---
def _parse_filter_container(filter_container):
    
    all_filters = {}
    filter_groups = filter_container.find_all('g-accordion-expander')
    for group in filter_groups:
        group_title_element = group.find('span', {'role': 'heading'})
        if not group_title_element: continue
                # Extract product info (example fields, adjust as needed)
                name = card.find('h4')
                price = card.find('span', class_='a8Pemb')
                seller = card.find('div', class_='b5ycib')
                rating = card.find('span', class_='NzUzee')
                products_data.append({
                    'name': name.text.strip() if name else '',
                    'price_current': price.text.strip() if price else '',
                    'seller': seller.text.strip() if seller else '',
                    'rating_score': rating.text.strip() if rating else '',
                })
        all_filters[group_name] = []
        option_list = group.find('ul', {'jsname': 'CbM3zb'})
        if not option_list: continue
        option_links = option_list.find_all('a')
        for link in option_links:
            info_div = link.find('div', class_='IFgTAb')
            if not info_div: continue
            option_name = info_div.get('title', '').strip()
            if not option_name: continue
            relative_url = link.get('href')
            full_url = urljoin('https://www.google.com/', relative_url) if relative_url else None
            aria_label = info_div.get('aria-label', '')
            is_selected = 'Selected.' in aria_label
            all_filters[group_name].append({
                'name': option_name, 'url_to_apply': full_url, 'is_selected': is_selected
            })
    on_sale_link = filter_container.find('a', {'title': 'On sale'})
    if on_sale_link:
        relative_url = on_sale_link.get('href')
        full_url = urljoin('https://www.google.com/', relative_url) if relative_url else None
        info_div = on_sale_link.find('div', class_='IFgTAb')
        is_selected = False
        if info_div:
            is_selected = 'Selected.' in info_div.get('aria-label', '')
        all_filters['Offer'] = [{'name': 'On sale', 'url_to_apply': full_url, 'is_selected': is_selected}]
    return all_filters

def get_filters_from_page(full_page_html):
    
    soup = BeautifulSoup(full_page_html, 'html.parser')
    refine_header = soup.find('h3', string='Refine results')
    if not refine_header:
        print("Warning: Could not find the 'Refine results' header.")
        return {}
    filter_container = refine_header.find_parent('div', {'role': 'navigation'})
    if not filter_container:
        print("Warning: Found header, but could not find parent navigation container.")
        return {}
    return _parse_filter_container(filter_container)


class GoogleShoppingScraper:
    def __init__(self):
        
        print("--- Initializing Scraper and Headless Browser ---")
        options = uc.ChromeOptions()
        prefs = {"profile.managed_default_content_settings.images": 2,"profile.managed_default_content_settings.stylesheets": 2,}
        options.add_experimental_option("prefs", prefs)
        options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument(f'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36')
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins-discovery")
        options.add_argument("--start-maximized")
        self.driver = uc.Chrome(options=options)
        self.driver.implicitly_wait(5)  # Add implicit wait to reduce explicit wait times
        print("Browser initialized successfully.")

    def apply_filters_and_get_url(self, base_query, selected_filter_names):
        
        initial_url = f"https://www.google.com/search?tbm=shop&q={quote_plus(base_query)}"
        self.driver.get(initial_url)
        for i, filter_to_apply in enumerate(selected_filter_names):
            print(f"\n--- Applying filter {i+1}/{len(selected_filter_names)}: '{filter_to_apply}' ---")
            try:
                WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.XPATH, "//h3[text()='Refine results']")))
            except Exception:
                print(f"FATAL: Could not find 'Refine results' header. Page might be blocked.")
                raise
            current_html = self.driver.page_source
            available_filters = get_filters_from_page(current_html)
            url_to_visit = None
            for group in available_filters.values():
                for option in group:
                    if option['name'] == filter_to_apply:
                        url_to_visit = option['url_to_apply']
                        break
                if url_to_visit:
                    break
            if url_to_visit:
                print(f"Navigating to apply filter...")
                self.driver.get(url_to_visit)
            else:
                print(f"Warning: Could not find filter '{filter_to_apply}'. Skipping.")
        print("\nAll filters applied successfully.")
        return self.driver.current_url

    def scrape_product_results(self, max_products=10):
        """
        Scrapes product data using a two-pass enrichment strategy.
        Pass 1: Scrapes all static data from the grid (prices, ratings, etc.).
        Pass 2: Interactively clicks each card to get dynamic data (links, images)
                and updates the initial data. Limited to max_products for speed.
        """
        print("\n--- Starting Two-Pass Scraping ---")
        products_data = []

        # --- PASS 1: Shallow Scrape of the Grid for Static Data ---
        print("Pass 1: Scraping static grid data...")
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        
        initial_cards = soup.find_all('li', class_='YBo8bb')
        for card in initial_cards:
            try:
                link_div = card.find('div', {'role': 'link'})
                if not link_div: continue
                
                title = link_div.find('div', class_='gkQHve').text.strip()
                price_current = link_div.find('span', class_='lmQWe').text.strip()
                price_original_el = link_div.find('span', class_='DoCHT')
                price_original = price_original_el.text.strip() if price_original_el else None
                seller = link_div.find('span', class_='WJMUdc').text.strip()

                rating_score_el = link_div.find('span', class_='yi40Hd')
                review_count_el = link_div.find('span', class_='RDApEe')
                rating_score = rating_score_el.text.strip() if rating_score_el else None
                review_count = review_count_el.text.strip('()') if review_count_el else None

                products_data.append({
                    'title': title,
                    'price_current': price_current,
                    'price_original': price_original,
                    'seller': seller,
                    'rating_score': rating_score,
                    'review_count': review_count,
                    'product_link': None, # Placeholder
                    'image_url': None     # Placeholder
                })
            except Exception:
                continue
        print(f"Pass 1 complete. Found {len(products_data)} products to enrich.")

        # --- PASS 2: Interactive Enrichment for Dynamic Data ---
        print(f"\nPass 2: Interactively enriching data with real links and images for up to {max_products} products...")
        card_elements = self.driver.find_elements(By.CSS_SELECTOR, "div.LrTUQ")
        
        for i, card_element in enumerate(card_elements):
            if i >= len(products_data) or i >= max_products: break # Limit enrichment for speed

            print(f"  Processing card {i+1}...")
            try:
                card_element.click()
                wait = WebDriverWait(self.driver, 5)
                detail_container_element = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.zxYWDc"))
                )
                
                detail_html = detail_container_element.get_attribute('outerHTML')
                detail_soup = BeautifulSoup(detail_html, 'html.parser')

                seller_link_el = detail_soup.find('a', class_='uchJRc')
                product_link = seller_link_el.get('href', '') if seller_link_el else ''
                
                image_el = detail_soup.find('img', class_='KfAt4d')
                image_url = image_el.get('src', '') if image_el else ''

                # Update the initial dictionary with the new, rich data
                products_data[i]['product_link'] = product_link
                products_data[i]['image_url'] = image_url
                print(f"    > Enriched '{products_data[i]['title']}'")

            except Exception as e:
                print(f"    > Error enriching card {i+1}: {e}. Link/image will be missing.")
            
            finally:
                ActionChains(self.driver).send_keys(Keys.ESCAPE).perform()
                time.sleep(1)  # Reduced sleep time for faster processing

        return products_data[:max_products]  # Return only the limited set of enriched products

    def close(self):
        if self.driver:
            self.driver.quit()
            print("\n--- Browser Closed ---")

# The __main__ block remains the same and will now call the correct interactive function.
if __name__ == "__main__":
    base_query = "men's brown open toe sandals chappals"
    user_selections = ['Bata', 'Size']

    scraper = None
    try:
        scraper = GoogleShoppingScraper()
        master_url = scraper.apply_filters_and_get_url(base_query, user_selections)
        print("\n--- Generated Master URL ---")
        print(master_url)
        
        product_data = scraper.scrape_product_results()

        if product_data:
            print("\n--- Scraped Product Data (JSON) ---")
            print(json.dumps(product_data, indent=2, ensure_ascii=False))
            # Save to file for the frontend
            with open(r"c:\Users\Acer\OneDrive\Desktop\Sample Website\product-viewer-app\src\product-data.json", "w", encoding="utf-8") as f:
                json.dump(product_data, f, ensure_ascii=False, indent=2)
        else:
            print("\nCould not scrape any product data.")

    except Exception as e:
        print(f"\nAn error occurred in the main process: {e}")
    finally:
        if scraper:
            scraper.close()