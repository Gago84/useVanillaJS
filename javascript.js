// use fetch to retrieve the products and pass them to init
// report any errors that occur in the fetch operation
// once the products have been successfully loaded and formatted as a JSON object
// using response.json(), run the initialize() function

const url1='https://raw.githubusercontent.com/mdn/learning-area/main/javascript/apis/fetching-data/can-store/products.json';

fetch(url1)
  .then( response => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then( json => initialize(json) )
  .catch(err => {
    console.error(`Fetch problem: ${err.message}`);
    //Add show error message here to show on user's creeen
    showErrorMessage(`${err.message} (The server can't find the resource)`);
  });

// sets up the app logic, declares required variables, contains all the other functions
function initialize(products) {
  // grab the UI elements that we need to manipulate
  const category = document.querySelector('#category');
  const searchTerm = document.querySelector('#searchTerm');
  const searchBtn = document.querySelector('button');
  const main = document.querySelector('main');

  // keep a record of what the last category and search term entered were
  let lastCategory = category.value;
  // no search has been made yet
  let lastSearch = '';

  // these contain the results of filtering by category, and search term
  // finalGroup will contain the products that need to be displayed after
  // the searching has been done. Each will be an array containing objects.
  // Each object will represent a product
  let categoryGroup;
  let finalGroup;

  // To start with, set finalGroup to equal the entire products database
  // then run updateDisplay(), so ALL products are displayed initially.
  finalGroup = products;
  updateDisplay();

  // Set both to equal an empty array, in time for searches to be run
  categoryGroup = [];
  finalGroup = [];

  // when the search button is clicked, invoke selectCategory() to start
  // a search running to select the category of products we want to display
  searchBtn.addEventListener('click', selectCategory);

  function selectCategory(e) {
    // Use preventDefault() to stop the form submitting — that would ruin
    // the experience
    e.preventDefault();

    // Set these back to empty arrays, to clear out the previous search
    categoryGroup = [];
    finalGroup = [];

    // if the category and search term are the same as they were the last time a
    // search was run, the results will be the same, so there is no point running
    // it again — just return out of the function
    if (category.value === lastCategory && searchTerm.value.trim() === lastSearch) {
      return;
    } else {
      // update the record of last category and search term
      lastCategory = category.value;
      lastSearch = searchTerm.value.trim();
      // In this case we want to select all products, then filter them by the search
      // term, so we just set categoryGroup to the entire JSON object, then run selectProducts()
      if (category.value === 'All') {
        categoryGroup = products;
        selectProducts();
      // If a specific category is chosen, we need to filter out the products not in that
      // category, then put the remaining products inside categoryGroup, before running
      // selectProducts()
      } else {
        // the values in the <option> elements are uppercase, whereas the categories
        // store in the JSON (under "type") are lowercase. We therefore need to convert
        // to lower case before we do a comparison
        const lowerCaseType = category.value.toLowerCase();
        // Filter categoryGroup to contain only products whose type includes the category
        categoryGroup = products.filter( product => product.type === lowerCaseType );
        // Run selectProducts() after the filtering has been done
        selectProducts();
      }
    }
  }

  // selectProducts() Takes the group of products selected by selectCategory(), and further
  // filters them by the tiered search term (if one has been entered)
  function selectProducts() {
    // If no search term has been entered, just make the finalGroup array equal to the categoryGroup
    // array — we don't want to filter the products further.
    if (searchTerm.value.trim() === '') {
      finalGroup = categoryGroup;
    } else {
      // Make sure the search term is converted to lower case before comparison. We've kept the
      // product names all lower case to keep things simple
      const lowerCaseSearchTerm = searchTerm.value.trim().toLowerCase();
      // Filter finalGroup to contain only products whose name includes the search term
      finalGroup = categoryGroup.filter( product => product.name.includes(lowerCaseSearchTerm));
    }
    // Once we have the final group, update the display
    updateDisplay();
  }

  // start the process of updating the display with the new set of products
  function updateDisplay() {
    // remove the previous contents of the <main> element
    while (main.firstChild) {
      main.removeChild(main.firstChild);
    }

    // if no products match the search term, display a "No results to display" message
    if (finalGroup.length === 0) {
      const para = document.createElement('p');
      para.textContent = 'No results to display!';
      main.appendChild(para);
    // for each product we want to display, pass its product object to fetchBlob()
    } else {
      for (const product of finalGroup) {
        fetchBlob(product);
      }
    }
  }

  // fetchBlob uses fetch to retrieve the image for that product, and then sends the
  // resulting image display URL and product object on to showProduct() to finally
  // display it
  function fetchBlob(product) {
    // construct the URL path to the image file from the product.image property
    const url = `https://raw.githubusercontent.com/mdn/learning-area/main/javascript/apis/fetching-data/can-store/images/${product.image}`;
    // Use fetch to fetch the image, and convert the resulting response to a blob
    // Again, if any errors occur we report them in the console.
    fetch(url)
      .then( response => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.blob();
      })
      .then( blob => showProduct(blob, product) )
      .catch( err => console.error(`Fetch problem: ${err.message}`) );
  }

  // Display a product inside the <main> element
  function showProduct(blob, product) {
    // Convert the blob to an object URL — this is basically an temporary internal URL
    // that points to an object stored inside the browser
    const objectURL = URL.createObjectURL(blob);
    // create <section>, <h2>, <p>, and <img> elements + buy button
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    const para = document.createElement('p');
    const image = document.createElement('img');
    // create buy button
    const buyBtn = document.createElement('button');

    // give the <section> a classname equal to the product "type" property so it will display the correct icon
    section.setAttribute('class', product.type);

    // Give the <h2> textContent equal to the product "name" property, but with the first character
    // replaced with the uppercase version of the first character
    heading.textContent = product.name.replace(product.name.charAt(0), product.name.charAt(0).toUpperCase());

    // Give the <p> textContent equal to the product "price" property, with a $ sign in front
    // toFixed(2) is used to fix the price at 2 decimal places, so for example 1.40 is displayed
    // as 1.40, not 1.4.
    para.textContent = `$${product.price.toFixed(2)}`;

    // Set the src of the <img> element to the ObjectURL, and the alt to the product "name" property
    image.src = objectURL;
    image.alt = product.name;

    // add text and class to the buy button
    buyBtn.textContent = 'Buy';
    buyBtn.className = 'buy-button';

      // add an event listener to the buy button to log the product name when clicked
    buyBtn.addEventListener('click', () => {
    // Show the buy form
    const buyForm = document.querySelector('#buyForm');
    buyForm.style.display = 'block';

    // Fill in the product name
    const buyProductName = document.querySelector('#buyProductName');
    buyProductName.value = product.name.charAt(0).toUpperCase() + product.name.slice(1);

    // Optional: scroll into view for user focus
    buyForm.scrollIntoView({ behavior: 'smooth' });
    });

    // append the elements to the DOM as appropriate, to add the product to the UI
    main.appendChild(section);
    section.appendChild(heading);
    section.appendChild(para);
    section.appendChild(image);
    // append the buy button to the section
    section.appendChild(buyBtn);
  }
}

// add function to show error message can not find the resource of downloaded page for user's screen outside of initialize function
function showErrorMessage(message) {
  const errorDiv = document.querySelector('.error-message');
  errorDiv.textContent = message;
}

// Handle the buy form submission
const buyForm = document.querySelector('#buyForm');
buyForm.addEventListener('submit', function (e) {
  e.preventDefault(); // Prevent page reload

  const productName = document.querySelector('#buyProductName').value;
  const quantity = document.querySelector('#buyQuantity').value;

  alert(`You have purchased ${quantity} x ${productName}. Thank you!`);

  // Optionally hide the form after submission
  buyForm.style.display = 'none';
  buyForm.reset(); // Reset the form fields
});

// Handle the cancel perchase button click
document.getElementById('cancelPurchaseBtn').addEventListener('click', () => {
// Hide the buy form when cancel button is clicked
  document.getElementById('buyForm').reset(); // Reset the form fields
  document.getElementById('buyForm').style.display = 'none';
});

document.getElementById('signup-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-container').style.display = 'block';
});

document.getElementById('cancel-signup-btn').addEventListener('click', () => {
    document.getElementById('signup-container').style.display = 'none';    
});

document.getElementById('cancel-otp-btn').addEventListener('click', () => {
  document.getElementById('signup-container').style.display = 'none';
});